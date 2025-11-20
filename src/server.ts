import express, { ErrorRequestHandler } from 'express';
import session from 'express-session';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import fs from 'fs';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { doubleCsrfProtection, generateCsrfToken, isCsrfError } from './core/csrf';
import ConfigModel from './models/config';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import hpp from 'hpp';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import { connectMongo, disconnectMongo } from './db/mongo';
import requestLogger from './middlewares/requestLogger';

import sitemapRouter from './routes/sitemap';
import homeRouter from './routes/index';
import authRouter from './routes/auth';
import heartRouter from './routes/heart';
import reservationRouter from './routes/reservation';
import errorHandler from './middlewares/error';

dotenv.config();

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';
const PORT = Number(process.env.PORT) || 3000;
const SESSION_NAME = process.env.COOKIE_NAME || process.env.SESSION_NAME || 'sid'
const SITE_URL = (process.env.SITE_URL || 'https://closjarjart.fr').replace(/\/$/, '');

app.disable('x-powered-by');          // cache l’info de stack
app.set('trust proxy', 1); // requis pour TLS/redirect derrière un proxy

app.use(morgan(isProd ? 'combined' : 'dev'));

app.use(compression());

app.use(cors({
  origin: ORIGIN,
  credentials: true,
  methods: ['GET','HEAD','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type','Authorization','X-CSRF-Token']
}));

app.use(hpp());

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(requestLogger);

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  name: SESSION_NAME,
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
    maxAge: Number(process.env.SESSION_MAX_AGE || 60*60*24*30) * 1000
  }
}));


// --- Helmet (headers de sécurité + CSP de base)
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' }
}));

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'script-src-attr': ["'self'", "'unsafe-inline'"],
      'frame-src': ["'self'", 'https: data:'],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'https: data:'],
      'connect-src': ["'self'", ORIGIN],
      'frame-ancestors': ["'self'"],
      'upgrade-insecure-requests': isProd ? [] : null
    }
  })
);
/*
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
const speedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 60,
  delayMs:(hits) => hits * 100
});
app.use(limiter);
app.use(speedLimiter);*/

app.use((req, res, next) => {
  if (isProd && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

connectMongo()
.then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server on http://localhost:${PORT} (env=${process.env.NODE_ENV})`);
  });
})
.catch((err) => {
  console.error('❌ Failed to connect Mongo:', err);
  process.exit(1);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/static', express.static(path.join(__dirname, 'public'), {
  immutable: true,
  maxAge: isProd ? '30d' : 0
}));

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /heart'
  ].join('\n'));
});

// Expose le helper à tes vues (EJS)
app.use((req, res, next) => {
  (res.locals as any).csrfToken = generateCsrfToken(req, res);
  (res.locals as any).siteUrl = SITE_URL;
  (res.locals as any).canonicalUrl = `${SITE_URL}${req.path === '/' ? '' : req.path}`;
  next();
});

app.use(async (req, res, next) => {
  const config = await ConfigModel.findOne().sort({ createdAt: -1 });

  if (req.path.startsWith("/heart") || req.path.startsWith("/auth") || req.path.startsWith("/reservation")) return next();

  if (config?.maintenance == "true") {
    res.status(503);
    res.set("Retry-After", "3600");
    return res.sendFile(path.join(__dirname, "public", "503.html"));
  }
  next();
});


app.use('/sitemap.xml', sitemapRouter);
app.use('/', homeRouter);
app.use('/auth', authRouter);
app.use('/heart', heartRouter);
app.use('/reservation', reservationRouter);

app.use((_req, res) => res.status(404).send('Not found'));
app.use(errorHandler);

app.use(((err, _req, res, next) => {
  if (isCsrfError(err)) {
    return res.status(403).json({ error: true, message: 'Token CSRF invalide' });
  }
  next(err);
}) as ErrorRequestHandler);

app.use(mongoSanitize());

const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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
