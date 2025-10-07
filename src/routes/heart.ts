import { Router } from 'express';
import path from 'path';
import { requireAuth } from '../middlewares/auth';
import { makeImageUpload, processImageUploadToDatabase, safeUnlink } from '../core/upload';
import PhotoModel from '../models/photo';
import ConfigModel from '../models/config';
import {ObjectId} from 'mongodb';
import { getReservationsAsArray } from '../core/reservation';
import Reservation from '../models/reservation';

const router = Router();
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const upload = makeImageUpload(uploadsDir);

router.get('/login', async (req, res) => {
  res.render('heart/login');
});

router.delete('/photos', requireAuth, async (req, res) => {
  try {
    const items = await PhotoModel.find().lean();
    await Promise.all(items.map(i => i.path ? safeUnlink(i.path, uploadsDir) : Promise.resolve()));
    await PhotoModel.deleteMany();
  } catch (e) { }

  res.json({ok:true});
});

router.delete('/photo/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const item = await PhotoModel.findById(new ObjectId(id as unknown as string));

    if(item){
      await safeUnlink(item.path, uploadsDir);
      await item.deleteOne();
    }
  } catch (e) { }

  res.redirect('/heart');
});

router.post('/photo/setDefault/:id', requireAuth, async (req, res) => {
  try {
      const items = await PhotoModel.find();
      await Promise.all(items.map(photo => {
        if(photo._id.toString() == req.params.id) photo.default = true;
        else{
          photo.default = false;
        }
        photo.save();
        Promise.resolve();
      }));
  } catch (e) { }

  res.json({ok:true});
});

router.get('/', requireAuth, async (req, res) => {
  // Get all photos
  const photos = await PhotoModel.find().sort({ createdAt: -1 }).limit(50).lean();
  let config = await ConfigModel.findOne().sort({ createdAt: -1 });

  if(!config) config = await ConfigModel.create({});

  const reservationArray = await getReservationsAsArray();

  res.render('heart/heart', { photos: photos, config: config, blockedDate:JSON.stringify(reservationArray)});
});

router.post('/', upload.array('cfg_photos', 6), requireAuth, async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    files?.map(file => processImageUploadToDatabase(req, file));
  } catch (e) { }

 if(req.body){
  const config = new ConfigModel(req.body);
  config.save();
 }

  res.redirect('/heart');
});

export default router;