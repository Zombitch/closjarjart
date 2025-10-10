import { Router, Request } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/user';
import { requireAuth } from '../middlewares/auth';
import env from '../core/env';
import { doubleCsrfProtection } from '../core/csrf';

const router = Router();
const SALT_ROUNDS = 12;

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

async function establishSession(req: Request, user: { _id: string; roles: string[] }) {
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        return reject(regenerateError);
      }

      req.session.userId = String(user._id);
      req.session.roles = user.roles;

      req.session.save((saveError) => {
        if (saveError) {
          return reject(saveError);
        }
        resolve();
      });
    });
  });
}

router.post('/register', doubleCsrfProtection, async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ error: true, message: 'Un compte existe déjà avec cet e-mail.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, passwordHash, roles: [] });

    await establishSession(req, { _id: String(user._id), roles: user.roles ?? [] });

    res.status(201).json({ ok: true, user: { id: user._id, email: user.email } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'email et password requis', details: error.flatten() });
    }
    next(error);
  }
});

router.post('/login', doubleCsrfProtection, async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: true, message: 'Identifiants invalides' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: true, message: 'Identifiants invalides' });
    }

    await establishSession(req, { _id: String(user._id), roles: user.roles ?? [] });

    res.json({ ok: true, user: { id: user._id, email: user.email } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'email et password requis', details: error.flatten() });
    }
    next(error);
  }
});

router.get('/check', requireAuth, async (_req, res) => {
  res.json({ title: 'Hello Express', message: 'It works' });
});

router.post('/logout', doubleCsrfProtection, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie(env.session.cookieName);
    res.json({ ok: true });
  });
});

export default router;

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    roles?: string[];
  }
}
