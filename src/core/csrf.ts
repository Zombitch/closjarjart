import { doubleCsrf, DoubleCsrfUtilities } from 'csrf-csrf';

const isProd = process.env.NODE_ENV === 'production';

const {
  doubleCsrfProtection,
  generateCsrfToken,
  invalidCsrfTokenError,
} = doubleCsrf({
  // clé(s) secrète(s) forte(s) — idéalement rotation possible
  getSecret: () => process.env.CSRF_SECRET!,
  // identifiant unique de session / utilisateur (ex: req.session.id)
  getSessionIdentifier: (req) => (req.session as any)?.id ?? req.ip,
  cookieName: "x-csrf-token",            // en dev, pas de préfixe __Host-
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
  },
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] || req.body?._csrf || req.query?._csrf
});

const InvalidCsrfErrorClass = invalidCsrfTokenError as unknown as new (...args: any[]) => Error;

export { doubleCsrfProtection, generateCsrfToken };

export function isCsrfError(err: unknown): err is Error {
  return err instanceof InvalidCsrfErrorClass;
}