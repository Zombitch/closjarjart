import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.get('/login', async (req, res) => {
  res.render('heart-login');
});

router.get('/', requireAuth, async (req, res) => {
  res.render('heart', { title: 'Hello Express', message: 'Bienvenue 👋' });
});

export default router;
