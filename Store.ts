import mongoose, { Schema, Document } from 'mongoose';

export interface IAisle {
  id: string;
  name: string;
  location: string;
}

export interface IStore extends Document {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  openingHours?: {
    Monday?: string;
    Tuesday?: string;
    Wednesday?: string;
    Thursday?: string;
    Friday?: string;
    Saturday?: string;
    Sunday?: string;
  };
  aisles: IAisle[];
}

const AisleSchema = new Schema<IAisle>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  location: { type: String, required: true }
}, { _id: false });

const StoreSchema = new Schema<IStore>({
  name: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  phone: { type: String },
  openingHours: {
    Monday: { type: String },
    Tuesday: { type: String },
    Wednesday: { type: String },
    Thursday: { type: String },
    Friday: { type: String },
    Saturday: { type: String },
    Sunday: { type: String },
  },
  aisles: { type: [AisleSchema], default: [] }
}, {
  timestamps: true
});

export const Store = mongoose.model<IStore>('Store', StoreSchema);
