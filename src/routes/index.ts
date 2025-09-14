import { Router } from 'express';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

const router = Router();

// Page HTML
router.get('/', (_req, res) => {
  res.render('index', { title: 'Hello Express', message: 'Bienvenue 👋' });
});

// API health
router.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Exemple: création d’un commentaire
const CommentSchema = z.object({
  author: z.string().min(1).max(100),
  content: z.string().min(1).max(2000)
});

router.post('/api/comments', (req, res, next) => {
  const parsed = CommentSchema.safeParse(req.body);
  if (!parsed.success) {
    return next({ status: 400, publicMessage: 'Payload invalide' });
  }
  // Nettoyage HTML si tu stockes/affiches du HTML
  const clean = {
    author: sanitizeHtml(parsed.data.author, { allowedTags: [], allowedAttributes: {} }),
    content: sanitizeHtml(parsed.data.content, {
      allowedTags: ['b','i','em','strong','a','code','pre'],
      allowedAttributes: { a: ['href','rel','target'] },
      allowedSchemes: ['http','https','mailto','tel']
    })
  };

  // TODO: persister en DB (avec requêtes paramétrées)
  return res.status(201).json({ ok: true, comment: clean });
});

export default router;
