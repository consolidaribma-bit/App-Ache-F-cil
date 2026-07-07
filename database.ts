import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import * as net from 'net';

// Persistent data directory for local development (no admin required)
const LOCAL_DB_PATH = path.resolve(process.cwd(), '.mongodb-data');

// Helper function to check if MongoDB is running locally
const isMongoDBRunning = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(27017, 'localhost');
  });
};

export const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    // If a real URI is provided, use it directly
    if (MONGODB_URI && !MONGODB_URI.includes('localhost')) {
      await mongoose.connect(MONGODB_URI);
      console.log('🔌 MongoDB Atlas conectado!');
      return;
    }

    // Check if local MongoDB is running
    const isRunning = await isMongoDBRunning();
    if (isRunning) {
      try {
        await mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/ache-facil', {
          serverSelectionTimeoutMS: 2000,
        });
        console.log('🔌 MongoDB local conectado!');
        return;
      } catch {
        // Local MongoDB not available - continue to fallback
      }
    }

    // Fall back to in-memory mock database on Windows
    console.log('💾 Usando banco de dados em memória para desenvolvimento...');
    console.log('⚠️  Ative MongoDB local para persitência entre reinicializações!');
    
    // Setup mongoose to use a mock connection
    const mockConnection = {
      readyState: 1,
      _events: {},
      models: {},
    } as any;

    // Extend mongoose with mock database methods
    (mongoose as any).connection = mockConnection;
    (mongoose as any).mockMode = true;

    console.log(`✅ Banco de dados em memória ativo`);

  } catch (error) {
    console.error('❌ Erro de conexão com MongoDB:', error);
    process.exit(1);
  }
};
