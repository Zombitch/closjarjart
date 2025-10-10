import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const booleanString = z
  .enum(['true', 'false'])
  .optional()
  .transform(value => value === 'true');

const commaSeparated = (value?: string) =>
  value
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().max(65535).default(3000),
    ORIGIN: z.string().optional(),
    SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters long'),
    COOKIE_SECRET: z.string().min(16).optional(),
    SESSION_NAME: z.string().min(1).optional(),
    COOKIE_NAME: z.string().min(1).optional(),
    SESSION_MAX_AGE: z.coerce.number().int().positive().optional(),
    CSRF_SECRET: z.string().min(16, 'CSRF_SECRET must be at least 16 characters long'),
    MONGO_URI: z.string().min(1).default('mongodb://localhost:27017/closjarjart'),
    RATE_LIMIT_ENABLED: booleanString,
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().optional(),
    RATE_LIMIT_LIMIT: z.coerce.number().int().positive().optional(),
    SLOWDOWN_ENABLED: booleanString,
    SLOWDOWN_WINDOW_MS: z.coerce.number().int().positive().optional(),
    SLOWDOWN_DELAY_AFTER: z.coerce.number().int().nonnegative().optional(),
    SLOWDOWN_DELAY_MS: z.coerce.number().int().nonnegative().optional(),
    TRUST_PROXY: z
      .union([z.literal('true'), z.literal('false'), z.coerce.number().int().nonnegative()])
      .optional(),
    CORS_ALLOW_METHODS: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PWD: z.string().optional(),
    SMTP_TO: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    SEND_MAIL: booleanString,
  })
  .transform(parsed => {
    const sessionName = parsed.COOKIE_NAME ?? parsed.SESSION_NAME ?? 'sid';
    const corsMethods = parsed.CORS_ALLOW_METHODS
      ? parsed.CORS_ALLOW_METHODS.split(',').map(method => method.trim().toUpperCase()).filter(Boolean)
      : ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'];

    return {
      nodeEnv: parsed.NODE_ENV,
      isProd: parsed.NODE_ENV === 'production',
      port: parsed.PORT,
      origins: commaSeparated(parsed.ORIGIN) ?? ['http://localhost:5173'],
      session: {
        secret: parsed.SESSION_SECRET,
        cookieName: sessionName,
        maxAgeMs: (parsed.SESSION_MAX_AGE ?? 60 * 60 * 24 * 30) * 1000,
        cookieSecret: parsed.COOKIE_SECRET ?? parsed.SESSION_SECRET,
      },
      csrfSecret: parsed.CSRF_SECRET,
      mongoUri: parsed.MONGO_URI,
      rateLimit: {
        enabled: parsed.RATE_LIMIT_ENABLED ?? true,
        windowMs: parsed.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000,
        limit: parsed.RATE_LIMIT_LIMIT ?? 100,
      },
      slowDown: {
        enabled: parsed.SLOWDOWN_ENABLED ?? true,
        windowMs: parsed.SLOWDOWN_WINDOW_MS ?? 60 * 1000,
        delayAfter: parsed.SLOWDOWN_DELAY_AFTER ?? 60,
        delayMs: parsed.SLOWDOWN_DELAY_MS ?? 100,
      },
      trustProxy:
        parsed.TRUST_PROXY === 'true'
          ? true
          : parsed.TRUST_PROXY === 'false'
            ? false
            : parsed.TRUST_PROXY ?? 1,
      cors: {
        methods: corsMethods,
      },
      mail: {
        enabled: parsed.SEND_MAIL ?? false,
        user: parsed.SMTP_USER,
        password: parsed.SMTP_PWD,
        to: parsed.SMTP_TO,
        from: parsed.SMTP_FROM ?? (parsed.SMTP_USER ? `"CLOS JARJART" <${parsed.SMTP_USER}>` : undefined),
      },
    };
  });

const env = envSchema.parse(process.env);

export default env;
