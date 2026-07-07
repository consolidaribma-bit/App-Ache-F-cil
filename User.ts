import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  role: string;
  supermarket?: string | mongoose.Types.ObjectId;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['root', 'user'], default: 'user' },
  supermarket: { type: Schema.Types.Mixed },
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);
