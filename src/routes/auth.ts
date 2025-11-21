import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import User from '../models/user'
import { requireAuth } from '../middlewares/auth';
import { doubleCsrfProtection } from '../core/csrf';

const router = Router();
const SALT_ROUNDS = 12;
const isProd = process.env.NODE_ENV === 'production';
const SESSION_COOKIE_NAME = process.env.COOKIE_NAME || process.env.SESSION_NAME || 'sid';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Trop de tentatives de connexion, réessayez plus tard.' }
});

/*router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ error: true, message: 'email et password requis' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: true, message: 'Une erreur est survenue' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, passwordHash, roles: [] });

    req.session.userId = String(user._id);
    req.session.roles = user.roles;
    res.status(201).json({ ok: true, user: { id: user._id, email: user.email } });
  } catch (e) { next(e); }
});*/

router.post('/login', loginLimiter, doubleCsrfProtection, async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ error: true, message: 'email et password requis' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: true, message: 'Identifiants invalides' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: true, message: 'Identifiants invalides' });

    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.userId = String(user._id);
      req.session.roles = user.roles;
      res.redirect('/heart');
    });
  } catch (e) { next(e); }
});

router.get('/check', requireAuth, async (req, res) => {
  res.json({ title: 'Hello Express', message: 'It works' });
});

router.post('/logout', doubleCsrfProtection, (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProd
    });
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
  