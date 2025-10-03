import { Router } from 'express';
import PhotoModel from '../models/photo';
import ConfigModel from '../models/config';
import {ObjectId} from 'mongodb';
import Reservation from '../models/reservation';
import { doubleCsrfProtection } from '../core/csrf';
import { checkReservationConflict, computeTotalPrice, getReservations, getReservationsAsArray } from '../core/reservation';

const router = Router();

// Page HTML
router.get('/', async (_req, res) => {
  const photoDefault = await PhotoModel.findOne({ default: true }).sort({ createdAt: -1 }).limit(50).lean();
  const photos = await PhotoModel.find({ default: false }).sort({ createdAt: -1 }).limit(50).lean();
  let config = await ConfigModel.findOne().sort({ createdAt: -1 });
  
  if(!config) config = await ConfigModel.create({});  
  
  const reservationArray = await getReservationsAsArray();
  
  res.render('index', {photoDefault: photoDefault, photos: photos, config: config, blockedDate:JSON.stringify(reservationArray)});
});

router.get('/reservation/delete', async (_req, res) => {
  try {
    await Reservation.deleteMany();
  } catch (e) { }
  
  res.json({ok:true});
});

router.get('/reservation/list', async (_req, res) => {
  const reservationSchemaList = await getReservations();
  
  res.json({ok:true, reservations: reservationSchemaList});
});

router.post('/', doubleCsrfProtection, async (req, res, next) => {
  const config = await ConfigModel.findOne().sort({ createdAt: -1 });
  const { startDate, endDate, guests, name, contact } = req.body as { startDate: Date; endDate: Date, guests: number, name: string, contact: string };
  if (!startDate || !endDate || !guests || !name || !contact) return res.status(400).json({ error: true, ok:false, message: 'Données requises' });

  const formattedStartDate = new Date(startDate);
  const formattedEndDate = new Date(endDate);  
  const totalPrice = await computeTotalPrice(formattedStartDate, formattedEndDate);

  const reservationSchemaList = await Reservation.find({
    startDate: { $gt: formattedStartDate, $lt: formattedEndDate},
    endDate: { $gt: formattedStartDate, $lt: formattedEndDate}
  }).lean();

  if(await checkReservationConflict(formattedStartDate, formattedEndDate)){
    const reservationArray = await getReservationsAsArray();
    return res.status(201).json({ 
      ok: false, 
      message:"Une autre personne a réserver ce créneau entre temps. Nous vous invitons à sélectionner d'autres dates.",
      reservations: reservationArray
    });
  }else {
    await Reservation.create({ startDate: formattedStartDate, endDate: formattedEndDate, guests: guests, totalPrice: totalPrice, name: name, contact: contact });
    const reservationArray = await getReservationsAsArray();
    return res.status(201).json({ 
      ok: true, 
      message:"Votre demande de réservation a été envoyé.",
      reservations: reservationArray
    });
  }
});

export default router;
