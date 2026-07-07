import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { runSeed } from './config/seed';
import authRoutes from './routes/auth';
import shoppingListRoutes from './routes/shoppingList';
import menuRoutes from './routes/menu';
import offersRoutes from './routes/offers';
import storeRoutes from './routes/store';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shopping-lists', shoppingListRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/stores', storeRoutes);

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Connect to MongoDB & Seed, then Listen
const startServer = async () => {
  try {
    await connectDB();
    await runSeed();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
      console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar o servidor:', error);
  }
};

startServer();

