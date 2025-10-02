import { Router } from 'express';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import PhotoModel from '../models/photo';
import ConfigModel from '../models/config';
import {ObjectId} from 'mongodb';
import Reservation from '../models/reservation';
import { generateCsrfToken, doubleCsrfProtection } from '../core/csrf';

const router = Router();

// Page HTML
router.get('/', async (_req, res) => {
  const photoDefault = await PhotoModel.findOne({ default: true }).sort({ createdAt: -1 }).limit(50).lean();
  const photos = await PhotoModel.find({ default: false }).sort({ createdAt: -1 }).limit(50).lean();
  let config = await ConfigModel.findOne().sort({ createdAt: -1 });
  
  if(!config) config = await ConfigModel.create({});  
  
  res.render('index', {photoDefault: photoDefault, photos: photos, config: config, blockedDate:JSON.stringify([['2025-10-10T18:00:00Z','2025-10-12T11:00:00Z'],['2025-10-12T18:00:00Z','2025-10-16T11:00:00Z'],['2025-10-25T18:00:00Z','2025-10-28T11:00:00Z']])});
});

router.post('/', doubleCsrfProtection, async (req, res, next) => {
  const { startDate, endDate, guests } = req.body as { startDate: Date; endDate: Date, guests: number };
  if (!startDate || !endDate || !guests) return res.status(400).json({ error: true, message: 'Données requises' });

  //const reservation = await Reservation.create({ startDate, endDate, guests });

  return res.status(201).json({ ok: true});
});

export default router;
