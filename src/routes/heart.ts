import { Router } from 'express';
import path from 'path';
import { requireAuth } from '../middlewares/auth';
import { makeImageUpload, processImageUploadToDatabase, safeUnlink } from '../core/upload';
import PhotoModel from '../models/photo';
import ConfigModel from '../models/config';
import {ObjectId} from 'mongodb';

const router = Router();
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const upload = makeImageUpload(uploadsDir);

router.get('/login', async (req, res) => {
  res.render('heart-login');
});

router.delete('/photos', requireAuth, async (req, res) => {
  try {
    const items = await PhotoModel.find().lean();
    await Promise.all(items.map(i => i.path ? safeUnlink(i.path, uploadsDir) : Promise.resolve()));
    await PhotoModel.deleteMany();
  } catch (e) { }

  res.redirect('/heart');
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

router.get('/', requireAuth, async (req, res) => {
  // Get all photos
  const photos = await PhotoModel.find().sort({ createdAt: -1 }).limit(50).lean();
  let config = await ConfigModel.findOne().sort({ createdAt: -1 });

  if(config) await config.deleteOne();

  if(!config) config = await ConfigModel.create({});

  res.render('heart', { photos: photos, config: config });
});

router.post('/', upload.array('cfg_photos', 6), requireAuth, async (req, res) => {
  const debug = req.query.debug === '1';

  try {
    const files = req.files as Express.Multer.File[] | undefined;
    files?.map(file => processImageUploadToDatabase(req, file));
  } catch (e) { }

  res.redirect('/heart');
});

export default router;