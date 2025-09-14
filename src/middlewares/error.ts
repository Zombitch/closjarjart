import { Request, Response, NextFunction } from 'express';

export default function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const isProd = process.env.NODE_ENV === 'production';
  const status = err?.status || 500;
  const payload: any = { error: true, message: 'Internal Server Error' };

  // Message contrôlé si on l’a fixé côté app (ex: validation)
  if (err?.publicMessage) payload.message = err.publicMessage;

  // En dev, aider au debug
  if (!isProd) {
    payload.debug = {
      message: err?.message,
      stack: err?.stack
    };
  }

  res.status(status).json(payload);
}
