import mongoose, { Schema, Document } from 'mongoose';

export interface IShoppingListItem {
  id: string;
  name: string;
  checked: boolean;
  quantity?: number;
  category?: string;
  [key: string]: any;
}

export interface IShoppingList extends Document {
  title: string;
  items: IShoppingListItem[];
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShoppingListItemSchema = new Schema<IShoppingListItem>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  checked: { type: Boolean, default: false },
  quantity: { type: Number, default: 1 },
  category: { type: String }
}, { _id: false, strict: false });

const ShoppingListSchema = new Schema<IShoppingList>({
  title: { type: String, required: true },
  items: { type: [ShoppingListItemSchema], default: [] },
  completed: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const ShoppingList = mongoose.model<IShoppingList>('ShoppingList', ShoppingListSchema);
