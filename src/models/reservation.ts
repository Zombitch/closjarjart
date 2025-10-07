import mongoose, { Schema, InferSchemaType } from 'mongoose';
import { number } from 'zod';

const ReservationSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  guests: { type: Number, default: 1, required: false },
  totalPrice: { type: Number, required: false},
  type: { type: String, default:"SITE", required: false},
  lastname: { type: String, required: false},
  firstname: { type: String, required: false},
  tel: { type: String, required: false},
  email: { type: String, required: false},
  note: { type: String, required: false},
  archived: { type: Boolean, default:false, required: false},
  confirmed: { type: Boolean, default:false, required: false},
  paid: { type: Boolean, default:false, required: false},
  fees: { type: Number, required: false}
}, { versionKey: false });

export type Reservation = InferSchemaType<typeof ReservationSchema>;
export default mongoose.model<Reservation>('Reservation', ReservationSchema);
