import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth';
import { ObjectId } from 'mongodb';
import { getReservations, getReservationsAsArray, proceedReservation } from '../core/reservation';
import Reservation from '../models/reservation';
import { doubleCsrfProtection } from '../core/csrf';

const router = Router();

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Identifiant invalide');

const reservationBodySchema = z.object({
  id: objectIdSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  guests: z.coerce.number().int().positive('Le nombre de voyageurs doit être supérieur à 0'),
  lastname: z.string().trim().min(1),
  firstname: z.string().trim().min(1),
  email: z.string().trim().email().optional(),
  tel: z.string().trim().min(3).max(32).optional(),
  totalPrice: z.coerce.number().nonnegative().optional(),
  type: z.string().trim().max(32).optional(),
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = new ObjectId(objectIdSchema.parse(req.params.id));
    const reservation = await Reservation.findById(id).lean();

    if (!reservation) {
      return res.status(404).json({ error: true, message: 'Réservation introuvable' });
    }

    res.json(reservation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'Identifiant invalide' });
    }
    next(error);
  }
});

router.delete('/:id', requireAuth, doubleCsrfProtection, async (req, res, next) => {
  try {
    const id = new ObjectId(objectIdSchema.parse(req.params.id));
    const reservation = await Reservation.findByIdAndUpdate(id, { archived: true }, { new: true });

    if (!reservation) {
      return res.status(404).json({ error: true, message: 'Réservation introuvable' });
    }

    const reservationList = await getReservationsAsArray();
    return res.status(200).json({ ok: true, reservations: reservationList });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'Identifiant invalide' });
    }
    next(error);
  }
});

router.post('/', requireAuth, doubleCsrfProtection, async (req, res, next) => {
  try {
    const payload = reservationBodySchema.parse(req.body);

    if (!payload.id) {
      if (!payload.startDate || !payload.endDate) {
        return res.status(400).json({ error: true, ok: false, message: 'Dates de réservation requises' });
      }

      const reservationResult = await proceedReservation(
        payload.startDate,
        payload.endDate,
        payload.guests,
        payload.lastname,
        payload.firstname,
        payload.email ?? '',
        payload.tel ?? '',
        false,
        payload.totalPrice ?? -1,
        payload.type ?? 'SITE',
      );

      const status = reservationResult.ok ? 201 : 409;
      return res.status(status).json(reservationResult);
    }

    const updatePayload = {
      guests: payload.guests,
      lastname: payload.lastname,
      firstname: payload.firstname,
      email: payload.email,
      tel: payload.tel,
      totalPrice: payload.totalPrice,
      type: payload.type,
    } as const;

    const updatedReservation = await Reservation.findByIdAndUpdate(new ObjectId(payload.id), updatePayload, { new: true });

    if (!updatedReservation) {
      return res.status(404).json({ error: true, message: 'Réservation introuvable' });
    }

    const reservationArray = await getReservationsAsArray();
    return res.status(200).json({
      ok: true,
      message: 'Réservation mise à jour.',
      reservations: reservationArray,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, ok: false, message: 'Données invalides', details: error.flatten() });
    }
    next(error);
  }
});

router.get('/debug/list', requireAuth, async (_req, res, next) => {
  try {
    const reservationSchemaList = await getReservations();
    res.json({ ok: true, reservations: reservationSchemaList });
  } catch (error) {
    next(error);
  }
});

export default router;
