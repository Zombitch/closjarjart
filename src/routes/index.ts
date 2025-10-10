import { Router } from 'express';
import { z } from 'zod';
import PhotoModel from '../models/photo';
import ConfigModel from '../models/config';
import { doubleCsrfProtection } from '../core/csrf';
import { getReservationsAsArray, proceedReservation } from '../core/reservation';

const router = Router();

const reservationRequestSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  guests: z.coerce.number().int().positive(),
  lastname: z.string().trim().min(1),
  firstname: z.string().trim().min(1),
  email: z.string().trim().email(),
  tel: z.string().trim().min(4).max(32),
});

router.get('/', async (_req, res, next) => {
  try {
    const photoDefault = await PhotoModel.findOne({ default: true }).sort({ createdAt: -1 }).limit(50).lean();
    const photos = await PhotoModel.find({ default: false }).sort({ createdAt: -1 }).limit(50).lean();
    let config = await ConfigModel.findOne().sort({ createdAt: -1 });

    if (!config) {
      config = await ConfigModel.create({});
    }

    const reservationArray = await getReservationsAsArray();

    res.render('index', {
      photoDefault,
      photos,
      config,
      blockedDate: JSON.stringify(reservationArray),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', doubleCsrfProtection, async (req, res, next) => {
  try {
    const payload = reservationRequestSchema.parse(req.body);
    const reservationResult = await proceedReservation(
      payload.startDate,
      payload.endDate,
      payload.guests,
      payload.lastname,
      payload.firstname,
      payload.email,
      payload.tel,
      true,
    );

    const status = reservationResult.ok ? 201 : 409;
    return res.status(status).json(reservationResult);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        ok: false,
        message: 'Données invalides',
        details: error.flatten(),
      });
    }

    next(error);
  }
});

export default router;
