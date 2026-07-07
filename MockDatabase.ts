import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LISTS_FILE = path.join(DATA_DIR, 'shopping_lists.json');
const STORES_FILE = path.join(DATA_DIR, 'stores.json');
const MENUS_FILE = path.join(DATA_DIR, 'menus.json');
const OFFERS_FILE = path.join(DATA_DIR, 'offers.json');

// Garantir que o diretório existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface UserData {
  id: string;
  email: string;
  password: string;
  name: string;
  supermarket: string;
  role: string;
  created_at: string;
}

interface ShoppingListItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  aisle?: string;
}

interface ShoppingListData {
  id: string;
  user_id: string;
  title: string;
  items: ShoppingListItem[];
  store_id?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface StoreData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  phone: string;
  aisles: string[];
  opening_hours: Record<string, string>;
  created_at: string;
}

interface MenuData {
  id: string;
  store_id: string;
  name: string;
  description: string;
  items: any[];
  created_at: string;
}

interface OfferData {
  id: string;
  store_id: string;
  product_name: string;
  original_price: number;
  offer_price: number;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  description?: string;
  created_at: string;
}

class MockDatabase {
  private users: UserData[] = [];
  private lists: ShoppingListData[] = [];
  private stores: StoreData[] = [];
  private menus: MenuData[] = [];
  private offers: OfferData[] = [];

  constructor() {
    this.loadAll();
    this.seedStores();
  }

  private loadAll() {
    this.loadUsers();
    this.loadLists();
    this.loadStores();
    this.loadMenus();
    this.loadOffers();
  }

  private loadUsers() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        this.users = JSON.parse(data);
      }
    } catch (error) {
      this.users = [];
    }
  }

  private loadLists() {
    try {
      if (fs.existsSync(LISTS_FILE)) {
        const data = fs.readFileSync(LISTS_FILE, 'utf-8');
        this.lists = JSON.parse(data);
      }
    } catch (error) {
      this.lists = [];
    }
  }

  private loadStores() {
    try {
      if (fs.existsSync(STORES_FILE)) {
        const data = fs.readFileSync(STORES_FILE, 'utf-8');
        this.stores = JSON.parse(data);
      }
    } catch (error) {
      this.stores = [];
    }
  }

  private loadMenus() {
    try {
      if (fs.existsSync(MENUS_FILE)) {
        const data = fs.readFileSync(MENUS_FILE, 'utf-8');
        this.menus = JSON.parse(data);
      }
    } catch (error) {
      this.menus = [];
    }
  }

  private loadOffers() {
    try {
      if (fs.existsSync(OFFERS_FILE)) {
        const data = fs.readFileSync(OFFERS_FILE, 'utf-8');
        this.offers = JSON.parse(data);
      }
    } catch (error) {
      this.offers = [];
    }
  }

  private saveUsers() {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar usuários:', error);
    }
  }

  private saveLists() {
    try {
      fs.writeFileSync(LISTS_FILE, JSON.stringify(this.lists, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar listas:', error);
    }
  }

  private saveStores() {
    try {
      fs.writeFileSync(STORES_FILE, JSON.stringify(this.stores, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar lojas:', error);
    }
  }

  private saveMenus() {
    try {
      fs.writeFileSync(MENUS_FILE, JSON.stringify(this.menus, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar menus:', error);
    }
  }

  private saveOffers() {
    try {
      fs.writeFileSync(OFFERS_FILE, JSON.stringify(this.offers, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar ofertas:', error);
    }
  }

  private seedStores() {
    if (this.stores.length === 0) {
      const defaultStore: StoreData = {
        id: uuidv4(),
        name: 'Supermercado Central',
        address: 'Rua Principal, 123',
        city: 'São Paulo',
        state: 'SP',
        latitude: -23.5505,
        longitude: -46.6333,
        phone: '(11) 1234-5678',
        aisles: ['Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Congelados'],
        opening_hours: {
          Monday: '07:00-22:00',
          Tuesday: '07:00-22:00',
          Wednesday: '07:00-22:00',
          Thursday: '07:00-22:00',
          Friday: '07:00-23:00',
          Saturday: '07:00-23:00',
          Sunday: '08:00-22:00',
        },
        created_at: new Date().toISOString(),
      };
      this.stores.push(defaultStore);
      this.saveStores();
    }
  }

  // ===== USUÁRIOS =====
  createUser(userData: Omit<UserData, 'id' | 'created_at'>) {
    const user: UserData = {
      ...userData,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    this.users.push(user);
    this.saveUsers();
    return user;
  }

  findUserByEmail(email: string) {
    return this.users.find(u => u.email === email);
  }

  findUserById(id: string) {
    return this.users.find(u => u.id === id);
  }

  getAllUsers() {
    return this.users;
  }

  updateUser(id: string, updates: Partial<UserData>) {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      this.saveUsers();
      return this.users[index];
    }
    return null;
  }

  deleteUser(id: string) {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      this.saveUsers();
      return true;
    }
    return false;
  }

  // ===== LISTAS DE COMPRAS =====
  createShoppingList(data: Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at'>) {
    const list: ShoppingListData = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.lists.push(list);
    this.saveLists();
    return list;
  }

  getShoppingListsByUserId(userId: string) {
    return this.lists.filter(l => l.user_id === userId);
  }

  getShoppingListById(id: string) {
    return this.lists.find(l => l.id === id);
  }

  getAllShoppingLists() {
    return this.lists;
  }

  updateShoppingList(id: string, updates: Partial<ShoppingListData>) {
    const index = this.lists.findIndex(l => l.id === id);
    if (index !== -1) {
      this.lists[index] = { 
        ...this.lists[index], 
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.saveLists();
      return this.lists[index];
    }
    return null;
  }

  deleteShoppingList(id: string) {
    const index = this.lists.findIndex(l => l.id === id);
    if (index !== -1) {
      this.lists.splice(index, 1);
      this.saveLists();
      return true;
    }
    return false;
  }

  // ===== LOJAS =====
  getStores() {
    return this.stores;
  }

  getStoreById(id: string) {
    return this.stores.find(s => s.id === id);
  }

  // ===== MENUS =====
  getMenusByStoreId(storeId: string) {
    return this.menus.filter(m => m.store_id === storeId);
  }

  getAllMenus() {
    return this.menus;
  }

  // ===== OFERTAS =====
  getOffersByStoreId(storeId: string) {
    return this.offers.filter(o => o.store_id === storeId);
  }

  getAllOffers() {
    return this.offers;
  }
}

export const mockDB = new MockDatabase();
