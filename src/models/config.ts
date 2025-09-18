import mongoose, { Schema, InferSchemaType } from 'mongoose';

const ConfigSchema = new Schema({
  price: { type: Number, default:0},
  cleaning_fees: { type: Number, default:0},
  tax_rate: { type: Number, default:0},
  max_guests: { type: Number, default:0},
  sauna_price: { type: Number, default:0},
  jacuzzi_price: { type: Number, default:0},                                     
  canoe_short_price: { type: Number, default:0},                               
  canoe_medium_price: { type: Number, default:0},                               
  canoe_long_price: { type: Number, default:0},
  description: { type: String, default:''},
  rules: { type: String, default:''},
  equipments: { type: Array, default:[]},
  games: { type: Array, default:[]},
  createdAt: { type: Date, default: Date.now, index: true }
}, { versionKey: false });

export type Config = InferSchemaType<typeof ConfigSchema>;
export default mongoose.model<Config>('Config', ConfigSchema);
