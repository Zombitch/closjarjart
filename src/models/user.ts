import mongoose, { Schema, InferSchemaType } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, index: true, trim: true },
  passwordHash: { type: String, required: true },
  roles: { type: [String], default: [] }
}, { versionKey: false });

export type User = InferSchemaType<typeof UserSchema>;
export default mongoose.model<User>('User', UserSchema);
