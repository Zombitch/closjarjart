import { Request, Response, NextFunction } from 'express';
import env from '../core/env';

type KnownError = Error & {
  status?: number;
  publicMessage?: string;
};

export default function errorHandler(
  err: KnownError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = err?.status ?? 500;
  const payload: { error: true; message: string; debug?: { message?: string; stack?: string } } = {
    error: true,
    message: 'Internal Server Error',
  };

  if (err?.publicMessage) {
    payload.message = err.publicMessage;
  }

  if (!env.isProd) {
    const debug: { message?: string; stack?: string } = {};
    if (err?.message) {
      debug.message = err.message;
    }
    if (err?.stack) {
      debug.stack = err.stack;
    }
    if (Object.keys(debug).length > 0) {
      payload.debug = debug;
    }
  }

  res.status(status).json(payload);
}
