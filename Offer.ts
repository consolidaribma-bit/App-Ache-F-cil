import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
  title: string;
  description?: string;
  discount?: number;
  storeId?: string | mongoose.Types.ObjectId;
  expiresAt?: Date;
  image?: string;
  createdAt: Date;
}

const OfferSchema = new Schema<IOffer>({
  title: { type: String, required: true },
  description: { type: String },
  discount: { type: Number },
  storeId: { type: Schema.Types.Mixed },
  expiresAt: { type: Date },
  image: { type: String }
}, {
  timestamps: true
});

export const Offer = mongoose.model<IOffer>('Offer', OfferSchema);
