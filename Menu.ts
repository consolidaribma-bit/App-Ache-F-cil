import mongoose, { Schema, Document } from 'mongoose';

export interface IMenu extends Document {
  title: string;
  description?: string;
  items: any[];
  storeId?: string | mongoose.Types.ObjectId;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuSchema = new Schema<IMenu>({
  title: { type: String, required: true },
  description: { type: String },
  items: [Schema.Types.Mixed],
  storeId: { type: Schema.Types.Mixed },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Menu = mongoose.model<IMenu>('Menu', MenuSchema);
