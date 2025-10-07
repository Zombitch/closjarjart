
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import ConfigModel from '../models/config';
import {ObjectId} from 'mongodb';
import { getReservations, getReservationsAsArray, proceedReservation } from '../core/reservation';
import Reservation from '../models/reservation';

const router = Router();

router.get('/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  const reservation = await Reservation.findById(new ObjectId(id as unknown as string)).lean();
  let config = await ConfigModel.findOne().sort({ createdAt: -1 });

  res.json(reservation);
});

router.delete('/:id', requireAuth, async (_req, res) => {
  const id = _req.params.id;
  const reservation = await Reservation.findByIdAndUpdate(new ObjectId(id as unknown as string), { archived: true });
  const reservationList = await getReservationsAsArray();
  return res.status(201).json({ok:true, reservations: reservationList});
});

router.post('/', requireAuth, async (req, res) => {
  const config = await ConfigModel.findOne().sort({ createdAt: -1 });
  const { startDate, endDate, guests, lastname, firstname, email, tel, totalPrice, type } = req.body as { startDate: Date; endDate: Date, guests: number, lastname: string, firstname: string, email: string, tel: string, totalPrice: number, type: string };
  if (!startDate || !endDate || !guests || !lastname || !firstname || !totalPrice) return res.status(400).json({ error: true, ok:false, message: 'Données requises' });

  const formattedStartDate = new Date(startDate);
  const formattedEndDate = new Date(endDate);
 
  const reservationResult = await proceedReservation(formattedStartDate, formattedEndDate, guests, lastname, firstname, email, tel, false, totalPrice, type);

  return res.status(201).json(reservationResult);
});

/*router.get('/delete', requireAuth, async (_req, res) => {
  try {
    await Reservation.deleteMany();
  } catch (e) { }
  
  res.json({ok:true});
});*/

router.get('/list', requireAuth, async (_req, res) => {
  const reservationSchemaList = await getReservations();
  
  res.json({ok:true, reservations: reservationSchemaList});
});

export default router;