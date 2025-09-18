import mongoose, { Schema, InferSchemaType } from 'mongoose';

const PhotoSchema = new Schema({
  url: { type: String, required: true },             // e.g. /static/uploads/xyz.jpg
  path: { type: String, required: true },            // filesystem path (server-side)
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },            // bytes
  width: Number,                                     
  height: Number,
  uploaderId: { type: String },                      // if you have auth: req.session.userId
  createdAt: { type: Date, default: Date.now, index: true }
}, { versionKey: false });

export type Photo = InferSchemaType<typeof PhotoSchema>;
export default mongoose.model<Photo>('Photo', PhotoSchema);
