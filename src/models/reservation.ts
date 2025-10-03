import mongoose, { Schema, InferSchemaType } from 'mongoose';
import { number } from 'zod';

const ReservationSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  guests: { type: Number, default: 1 },
  totalPrice: { type: Number, required: false},
  isConfirmed: { type: Boolean, default:false, required: false},
  type: { type: String, default:"SITE", required: false}
}, { versionKey: false });

export type Reservation = InferSchemaType<typeof ReservationSchema>;
export default mongoose.model<Reservation>('Reservation', ReservationSchema);
