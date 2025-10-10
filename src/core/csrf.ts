import { doubleCsrf } from 'csrf-csrf';
import env from './env';

const {
  doubleCsrfProtection,
  generateCsrfToken,
  invalidCsrfTokenError,
} = doubleCsrf({
  getSecret: () => env.csrfSecret,
  getSessionIdentifier: (req) => req.sessionID ?? req.ip,
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    path: '/',
  },
  getCsrfTokenFromRequest: (req) =>
    (req.headers['x-csrf-token'] as string | undefined) ||
    (req.body && (req.body as Record<string, unknown>)._csrf as string | undefined) ||
    (req.query && req.query._csrf as string | undefined),
});

const InvalidCsrfErrorClass = invalidCsrfTokenError as unknown as new (...args: any[]) => Error;

export { doubleCsrfProtection, generateCsrfToken };

export function isCsrfError(err: unknown): err is Error {
  return err instanceof InvalidCsrfErrorClass;
}
