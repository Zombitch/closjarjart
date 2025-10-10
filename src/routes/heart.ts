import { Router } from 'express';
import path from 'path';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth';
import { makeImageUpload, processImageUploadToDatabase, safeUnlink } from '../core/upload';
import PhotoModel from '../models/photo';
import ConfigModel from '../models/config';
import { ObjectId } from 'mongodb';
import { getReservationsAsArray } from '../core/reservation';
import { doubleCsrfProtection } from '../core/csrf';

const router = Router();
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const upload = makeImageUpload(uploadsDir);

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Identifiant invalide');

const configSchema = z.object({
  price: z.coerce.number().nonnegative().optional(),
  cleaning_fees: z.coerce.number().nonnegative().optional(),
  tax_rate: z.coerce.number().nonnegative().optional(),
  max_guests: z.coerce.number().int().nonnegative().optional(),
  sauna_price: z.coerce.number().nonnegative().optional(),
  jacuzzi_price: z.coerce.number().nonnegative().optional(),
  canoe_short_price: z.coerce.number().nonnegative().optional(),
  canoe_medium_price: z.coerce.number().nonnegative().optional(),
  canoe_long_price: z.coerce.number().nonnegative().optional(),
  description: z.string().trim().max(10_000).optional(),
  rules: z.string().trim().max(10_000).optional(),
  equipments: z
    .union([z.array(z.string().trim()), z.string().trim()])
    .optional()
    .transform(value => {
      if (value === undefined) return undefined;
      return typeof value === 'string' ? [value] : value;
    }),
  games: z
    .union([z.array(z.string().trim()), z.string().trim()])
    .optional()
    .transform(value => {
      if (value === undefined) return undefined;
      return typeof value === 'string' ? [value] : value;
    }),
});

router.get('/login', async (_req, res) => {
  res.render('heart/login');
});

router.delete('/photos', requireAuth, doubleCsrfProtection, async (_req, res, next) => {
  try {
    const items = await PhotoModel.find().lean();
    await Promise.all(items.map(item => (item.path ? safeUnlink(item.path, uploadsDir) : Promise.resolve())));
    await PhotoModel.deleteMany();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/photo/:id', requireAuth, doubleCsrfProtection, async (req, res, next) => {
  try {
    const id = new ObjectId(objectIdSchema.parse(req.params.id));
    const item = await PhotoModel.findById(id);

    if (!item) {
      return res.status(404).json({ error: true, message: 'Photo introuvable' });
    }

    if (item.path) {
      await safeUnlink(item.path, uploadsDir);
    }

    await item.deleteOne();

    res.redirect('/heart');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'Identifiant invalide' });
    }
    next(error);
  }
});

router.post('/photo/setDefault/:id', requireAuth, doubleCsrfProtection, async (req, res, next) => {
  try {
    const id = new ObjectId(objectIdSchema.parse(req.params.id));

    const updated = await PhotoModel.findByIdAndUpdate(id, { $set: { default: true } }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: true, message: 'Photo introuvable' });
    }

    await PhotoModel.updateMany({ _id: { $ne: id } }, { $set: { default: false } });

    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'Identifiant invalide' });
    }
    next(error);
  }
});

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const photos = await PhotoModel.find().sort({ createdAt: -1 }).limit(50).lean();
    let config = await ConfigModel.findOne().sort({ createdAt: -1 });

    if (!config) {
      config = await ConfigModel.create({});
    }

    const reservationArray = await getReservationsAsArray();

    res.render('heart/heart', { photos, config, blockedDate: JSON.stringify(reservationArray) });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, upload.array('cfg_photos', 6), doubleCsrfProtection, async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      await Promise.all(files.map(file => processImageUploadToDatabase(req, file)));
    }

    if (req.body && Object.keys(req.body).length > 0) {
      const configPayload = configSchema.parse(req.body);
      await ConfigModel.findOneAndUpdate({}, configPayload, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        sort: { createdAt: -1 },
      });
    }

    res.redirect('/heart');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'Configuration invalide', details: error.flatten() });
    }
    next(error);
  }
});

export default router;
