import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  supermarket: string;
  role: 'admin' | 'user' | 'root';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));

interface ShoppingList {
  id: string;
  title: string;
  items: ShoppingItem[];
  createdAt: string;
  updatedAt: string;
  completed: boolean;
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  price?: number;
  aisle?: string;
}

interface ShoppingListStore {
  lists: ShoppingList[];
  currentList: ShoppingList | null;
  setLists: (lists: ShoppingList[]) => void;
  setCurrentList: (list: ShoppingList | null) => void;
  addList: (list: ShoppingList) => void;
  removeList: (id: string) => void;
  updateList: (id: string, data: Partial<ShoppingList>) => void;
}

export const useShoppingListStore = create<ShoppingListStore>((set) => ({
  lists: [],
  currentList: null,
  setLists: (lists) => set({ lists }),
  setCurrentList: (list) => set({ currentList: list }),
  addList: (list) => set((state) => ({ lists: [...state.lists, list] })),
  removeList: (id) =>
    set((state) => ({
      lists: state.lists.filter((list) => list.id !== id),
    })),
  updateList: (id, data) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === id ? { ...list, ...data } : list
      ),
    })),
}));

interface NotificationStore {
  notifications: any[];
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
