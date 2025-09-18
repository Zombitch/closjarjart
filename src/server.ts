import express, { ErrorRequestHandler, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import hpp from 'hpp';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import { connectMongo, disconnectMongo } from './db/mongo';

import homeRouter from './routes/index';
import authRouter from './routes/auth';
import heartRouter from './routes/heart';
import errorHandler from './middlewares/error';

dotenv.config();

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';
const PORT = Number(process.env.PORT) || 3000;
const SESSION_NAME = process.env.COOKIE_NAME || process.env.SESSION_NAME || 'sid'

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

app.use(cookieParser(process.env.SESSION_SECRET));

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
      'script-src': ["'self'"],
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
app.use(speedLimiter);

app.use((req, res, next) => {
  if (isProd && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/static', express.static(path.join(__dirname, 'public'), {
  immutable: true,
  maxAge: isProd ? '30d' : 0
}));

const {
  doubleCsrfProtection,
  generateCsrfToken,
  invalidCsrfTokenError,
} = doubleCsrf({
  // clé(s) secrète(s) forte(s) — idéalement rotation possible
  getSecret: () => process.env.SESSION_SECRET!,
  // identifiant unique de session / utilisateur (ex: req.session.id)
  getSessionIdentifier: (req) => (req.session as any)?.id ?? req.ip,
  cookieName: "_csrf",            // en dev, pas de préfixe __Host-
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
  },
});

// Expose le helper à tes vues (EJS)
app.use((req, res, next) => {
  (res.locals as any).csrfToken = () => generateCsrfToken(req, res);
  next();
});;

app.use((req, res, next) => {
  res.locals.csrfToken = null;
  next();
});

app.use(session({
  name: SESSION_NAME,
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
    maxAge: Number(process.env.SESSION_MAX_AGE || 60*60*24*30) * 1000
  }
}));

app.post('/', doubleCsrfProtection, (req, _res, next) => next());
app.put('/', doubleCsrfProtection, (req, _res, next) => next());
app.patch('/', doubleCsrfProtection, (req, _res, next) => next());
app.delete('/', doubleCsrfProtection, (req, _res, next) => next());

app.use('/', homeRouter);
app.use('/auth', authRouter);
app.use('/heart', heartRouter);

app.use((_req, res) => res.status(404).send('Not found'));

app.use(errorHandler);

app.use(((err, _req, res, next) => {
  if (err && (err as any).name === invalidCsrfTokenError.name) {
    return res.status(403).json({ error: true, message: 'Token CSRF invalide' });
  }
  next(err);
}) as ErrorRequestHandler);

app.use(mongoSanitize());

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
  app.listen(PORT, () => {
    console.log(`✅ Server on http://localhost:${PORT} (env=${process.env.NODE_ENV})`);
  });
})
.catch((err) => {
  console.error('❌ Failed to connect Mongo:', err);
  process.exit(1);
});
