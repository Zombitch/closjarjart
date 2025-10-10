import express, { ErrorRequestHandler } from 'express';
import session from 'express-session';
import path from 'path';
import helmet from 'helmet';
import fs from 'fs';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { generateCsrfToken, isCsrfError } from './core/csrf';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import hpp from 'hpp';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import env from './core/env';
import { connectMongo, disconnectMongo } from './db/mongo';

import homeRouter from './routes/index';
import authRouter from './routes/auth';
import heartRouter from './routes/heart';
import reservationRouter from './routes/reservation';
import errorHandler from './middlewares/error';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);

app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(compression());

const corsOrigins = env.origins.length === 1 ? env.origins[0] : env.origins;
const connectSrc = (Array.isArray(corsOrigins) ? corsOrigins : [corsOrigins]) as string[];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: env.cors.methods,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

if (env.rateLimit.enabled) {
  const limiter = rateLimit({
    windowMs: env.rateLimit.windowMs,
    limit: env.rateLimit.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
  app.use(limiter);
}

if (env.slowDown.enabled) {
  const speedLimiter = slowDown({
    windowMs: env.slowDown.windowMs,
    delayAfter: env.slowDown.delayAfter,
    delayMs: env.slowDown.delayMs,
  });
  app.use(speedLimiter);
}

app.use(hpp());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(env.session.cookieSecret));
app.use(session({
  name: env.session.cookieName,
  secret: env.session.secret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    maxAge: env.session.maxAgeMs,
  },
}));

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-site' },
  }),
);

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'script-src-attr': ["'self'", "'unsafe-inline'"],
      'frame-src': ["'self'", 'https:', 'data:'],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'https:', 'data:'],
      'connect-src': ["'self'", ...connectSrc],
      'frame-ancestors': ["'self'"],
      'upgrade-insecure-requests': env.isProd ? [] : null,
    },
  }),
);

app.use(mongoSanitize());

app.use((req, res, next) => {
  if (env.isProd && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/static', express.static(path.join(__dirname, 'public'), {
  immutable: true,
  maxAge: env.isProd ? '30d' : 0,
}));

app.use((req, res, next) => {
  (res.locals as any).csrfToken = generateCsrfToken(req, res);
  next();
});

app.use('/', homeRouter);
app.use('/auth', authRouter);
app.use('/heart', heartRouter);
app.use('/reservation', reservationRouter);

app.use((_req, res) => res.status(404).send('Not found'));
app.use(((err, _req, res, next) => {
  if (isCsrfError(err)) {
    return res.status(403).json({ error: true, message: 'Token CSRF invalide' });
  }
  return next(err);
}) as ErrorRequestHandler);
app.use(errorHandler);

process.on('uncaughtException', (err) => {
  console.error('UncaughtException:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UnhandledRejection:', reason);
});

process.on('SIGINT', async () => {
  await disconnectMongo();
  process.exit(0);
});

connectMongo()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`✅ Server on http://localhost:${env.port} (env=${env.nodeEnv})`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect Mongo:', err);
    process.exit(1);
  });
