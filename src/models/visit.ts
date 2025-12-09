import mongoose, { Schema, InferSchemaType } from 'mongoose';

const VisitSchema = new Schema({
  ip: { type: String},
  agent: { type: String},
  lang: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now, index: true },
  origin: { type: String},
  isRobot: { type: Boolean, default: false}
}, { versionKey: false });

export type Visit = InferSchemaType<typeof VisitSchema>;
export default mongoose.model<Visit>('Visit', VisitSchema);