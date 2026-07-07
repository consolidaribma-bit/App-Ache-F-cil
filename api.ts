import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string, supermarket: string) =>
    api.post('/auth/register', { email, password, name, supermarket }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  getStats: () => api.get('/auth/stats'),
  getUsers: () => api.get('/auth/users'),
  updateUserRole: (id: string, role: string) => api.put(`/auth/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/auth/users/${id}`),
};

export const shoppingListAPI = {
  getAll: () => api.get('/shopping-lists'),
  getById: (id: string) => api.get(`/shopping-lists/${id}`),
  create: (data: any) => api.post('/shopping-lists', data),
  update: (id: string, data: any) => api.put(`/shopping-lists/${id}`, data),
  delete: (id: string) => api.delete(`/shopping-lists/${id}`),
  addItem: (id: string, item: any) => api.post(`/shopping-lists/${id}/items`, item),
  removeItem: (id: string, itemId: string) =>
    api.delete(`/shopping-lists/${id}/items/${itemId}`),
  updateItem: (id: string, itemId: string, data: any) =>
    api.put(`/shopping-lists/${id}/items/${itemId}`, data),
  getRoute: (id: string, storeId: string) =>
    api.get(`/shopping-lists/${id}/route?storeId=${storeId}`),
};

export const menuAPI = {
  getAll: () => api.get('/menus'),
  getById: (id: string) => api.get(`/menus/${id}`),
  create: (data: any) => api.post('/menus', data),
  update: (id: string, data: any) => api.put(`/menus/${id}`, data),
  delete: (id: string) => api.delete(`/menus/${id}`),
};

export const offersAPI = {
  getAll: () => api.get('/offers'),
  getToday: () => api.get('/offers/today'),
  getById: (id: string) => api.get(`/offers/${id}`),
  create: (data: any) => api.post('/offers', data),
  update: (id: string, data: any) => api.put(`/offers/${id}`, data),
  delete: (id: string) => api.delete(`/offers/${id}`),
};

export const storeAPI = {
  getAll: () => api.get('/stores'),
  getById: (id: string) => api.get(`/stores/${id}`),
  getLayout: (id: string) => api.get(`/stores/${id}/layout`),
  uploadLayout: (id: string, formData: FormData) => 
    api.post(`/stores/${id}/layout/upload`, formData),
  create: (data: any) => api.post('/stores', data),
  delete: (id: string) => api.delete(`/stores/${id}`),
};
