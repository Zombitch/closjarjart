import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import fs from "fs/promises";
import PhotoModel from '../models/photo';

// Allow only common image MIME types
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

// Unique filename: <timestamp>-<rand>.<ext>
function uniqueName(originalName: string) {
  const ext = path.extname(originalName).toLowerCase();
  const base = Date.now().toString(36) + '-' + crypto.randomBytes(6).toString('hex');
  return base + ext;
}

export function makeImageUpload(uploadsDirAbs: string) {
  const storage = multer.diskStorage({
    destination: (_req: any, _file: any, cb: (arg0: null, arg1: string) => any) => cb(null, uploadsDirAbs),
    filename: (_req: any, file: { originalname: string; }, cb: (arg0: null, arg1: string) => any) => cb(null, uniqueName(file.originalname))
  });

  return multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
        cb(new Error('Invalid file type. Only images are allowed.'));
    },
    limits: { fileSize: 25 * 1024 * 1024  }
  });
}

export async function processImageUploadToDatabase(req: any, file: any){
    const filePath = file.path; // absolute FS path
    // public URL (served by /static)
    const publicUrl = '/static/uploads/' + file.filename;

    // extract width/height (optional)
    let width: number | undefined, height: number | undefined;
    try {
        const meta = await sharp(filePath).metadata();
        width = meta.width;
        height = meta.height;
    } catch { /* ignore if non-image or unsupported */ }

    const doc = await PhotoModel.create({
        url: publicUrl,
        path: filePath,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        uploaderId: (req.session as any)?.userId // if you have sessions
    });
}

export async function safeUnlink(filePath: string, baseDirAbs: string) {
  const resolved = path.resolve(filePath);
  const base = path.resolve(baseDirAbs);
  if (!resolved.startsWith(base + path.sep)) {
    // Outside allowed dir — refuse to delete
    throw Object.assign(new Error("Refusing to delete outside uploads dir"), { status: 400 });
  }
  try {
    await fs.unlink(resolved);
  } catch (err: any) {
    if (err?.code === "ENOENT") return; // already gone — ignore
    throw err;
  }
}