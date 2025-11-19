import { Router } from 'express';
import PhotoModel from '../models/photo';
import ConfigModel from '../models/config';
import VisitModel from '../models/visit';
import {ObjectId} from 'mongodb';
import Reservation from '../models/reservation';
import { doubleCsrfProtection } from '../core/csrf';
import { checkReservationConflict, computeNight, computeTotalPrice, getReservations, getReservationsAsArray, proceedReservation } from '../core/reservation';
import { start } from 'repl';

const router = Router();

// Page HTML
router.get('/', async (_req, res) => {
  const photoDefault = await PhotoModel.findOne({ default: true }).sort({ createdAt: -1 }).limit(50).lean();
  const photos = await PhotoModel.find({ default: false }).sort({ createdAt: 1 }).limit(50).lean();
  const lightboxPhotos = await PhotoModel.find().sort({default:-1, createdAt: 1 }).limit(50).lean();
  let config = await ConfigModel.findOne().sort({ createdAt: -1 });
  
  if(!config) config = await ConfigModel.create({});  
  
  const reservationArray = await getReservationsAsArray();

  VisitModel.create({ip:_req.ip});
  
  res.render('index', {photoDefault: photoDefault, photos: photos, lightboxPhotos:lightboxPhotos, config: config, blockedDate:JSON.stringify(reservationArray)});
});

router.post('/', doubleCsrfProtection, async (req, res, next) => {
  const config = await ConfigModel.findOne().sort({ createdAt: -1 });
  const { startDate, endDate, guests, lastname, firstname, email, tel } = req.body as { startDate: Date; endDate: Date, guests: number, lastname: string, firstname: string, email: string, tel: string };
  if (!startDate || !endDate || !guests || !lastname || !firstname || !email || !tel) return res.status(400).json({ error: true, ok:false, message: 'Données requises' });

  const formattedStartDate = new Date(startDate);
  const formattedEndDate = new Date(endDate);  
 
  const reservationResult = await proceedReservation(formattedStartDate, formattedEndDate, guests, lastname, firstname, email, tel, true);

  return res.status(201).json(reservationResult);
});

export default router;
