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

const buildLogContext = (req: Request) => ({
  ip: req.ip,
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
  const startMessage = buildLogContext(req);

  console.info(`[Request:${requestId}] Incoming`, startMessage);

  const logCompletion = (event: 'finish' | 'close' | 'error', error?: Error) => {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    const logBase = {
      requestId,
      statusCode: res.statusCode,
      event,
      durationMs: Number.isFinite(durationMs) ? Number(durationMs.toFixed(2)) : durationMs,
    };

    if (error) {
      console.error(`[Request:${requestId}] Error`, { ...logBase, error: error.message, stack: error.stack });
    } else {
      console.info(`[Request:${requestId}] Completed`, logBase);
    }
  };

  res.on('finish', () => logCompletion('finish'));
  res.on('close', () => logCompletion('close'));
  res.on('error', (err) => logCompletion('error', err));

  next();
};

export default requestLogger;
