import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization', 'cookie'];

type Primitive = string | number | boolean | null | undefined;

type Loggable = Primitive | Loggable[] | { [key: string]: Loggable };

const sanitizeValue = (value: unknown, depth = 0): Loggable => {
  if (depth > 4) {
    return '[Truncated]';
  }

  if (value === null || value === undefined) return value as null | undefined;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, val]) => {
      const loweredKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((sensitiveKey) => loweredKey.includes(sensitiveKey))) {
        return [key, '[Redacted]'];
      }
      return [key, sanitizeValue(val, depth + 1)];
    });
    return Object.fromEntries(entries);
  }
  if (typeof value === 'string') {
    return value.length > 500 ? `${value.slice(0, 497)}...` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return String(value);
};

const buildLogContext = (req: Request, res: Response) => ({
  ip: req.ip,
  status: res.statusCode,
  method: req.method,
  url: req.originalUrl,
  params: sanitizeValue(req.params),
  query: sanitizeValue(req.query),
  body: sanitizeValue(req.body),
  userAgent: req.headers['user-agent'],
});

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  const startTime = process.hrtime.bigint();
  const startMessage = buildLogContext(req, res);

  if(!startMessage.url.startsWith("/static")){
    console.info(`${new Date()} `, startMessage);
  }

  next();
};

export default requestLogger;
