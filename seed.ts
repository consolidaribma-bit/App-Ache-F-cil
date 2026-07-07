import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Store } from '../models/Store';
import { Offer } from '../models/Offer';
import { Menu } from '../models/Menu';

export const runSeed = async () => {
  try {
    // Skip seed if running in mock mode (in-memory database)
    if ((mongoose as any).mockMode) {
      console.log('⏭️  Seed pulado (banco de dados em memória)');
      return;
    }

    // 1. Seed Store
    const storeCount = await Store.countDocuments();
    let defaultStoreId = 'store-1';
    if (storeCount === 0) {
      const store = await Store.create({
        name: 'Supermercado Central',
        address: 'Rua Principal, 123',
        city: 'São Paulo',
        state: 'SP',
        latitude: -23.5505,
        longitude: -46.6333,
        phone: '(11) 1234-5678',
        openingHours: {
          Monday: '07:00 - 22:00',
          Tuesday: '07:00 - 22:00',
          Wednesday: '07:00 - 22:00',
          Thursday: '07:00 - 22:00',
          Friday: '07:00 - 23:00',
          Saturday: '07:00 - 23:00',
          Sunday: '08:00 - 22:00',
        },
        aisles: [
          { id: 'hortifruti', name: 'Hortifruti', location: 'Fundo do mercado' },
          { id: 'laticinios', name: 'Laticínios', location: 'Lateral direita' },
          { id: 'carnes', name: 'Carnes / Frios', location: 'Fundo' },
          { id: 'bebidas', name: 'Bebidas', location: 'Lateral esquerda' },
          { id: 'secos', name: 'Secos e Conservas', location: 'Centro' },
          { id: 'padaria', name: 'Padaria', location: 'Entrada à esquerda' },
          { id: 'limpeza', name: 'Limpeza / Higiene', location: 'Centro fundo' },
          { id: 'caixa', name: 'Caixa / Saída', location: 'Frente' },
        ],
      });
      defaultStoreId = store._id.toString();
      console.log('🌱 Supermercado padrão semeado!');
    } else {
      const store = await Store.findOne();
      if (store) defaultStoreId = store._id.toString();
    }

    // 2. Seed Root User
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await User.create({
        email: 'edukadoshmda@gmail.com',
        name: 'Edukados',
        supermarket: defaultStoreId,
        password: hashedPassword,
        role: 'root',
      });
      console.log('🌱 Usuário root padrão semeado!');
    }

    // 3. Seed Offers
    const offerCount = await Offer.countDocuments();
    if (offerCount === 0) {
      await Offer.create([
        {
          title: 'Super Promoção de Frutas',
          description: 'Todas as frutas com 50% de desconto',
          discount: 50,
          storeId: defaultStoreId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          image: '',
        },
        {
          title: 'Bebidas em Promoção',
          description: 'Refrigerantes e sucos com 30% OFF',
          discount: 30,
          storeId: defaultStoreId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          image: '',
        },
      ]);
      console.log('🌱 Ofertas iniciais semeadas!');
    }

    // 4. Seed Menus
    const menuCount = await Menu.countDocuments();
    if (menuCount === 0) {
      await Menu.create([
        {
          title: 'Hortifruti Fresco',
          description: 'Itens essenciais selecionados do hortifruti',
          items: [
            { id: 'm1', name: 'Maçã Gala', price: 5.99, category: 'frutas' },
            { id: 'm2', name: 'Banana Nanica', price: 2.99, category: 'frutas' },
            { id: 'm3', name: 'Cenoura Kg', price: 3.49, category: 'vegetais' },
          ],
          storeId: defaultStoreId,
          active: true,
        },
        {
          title: 'Café da Manhã Completo',
          description: 'Tudo o que você precisa para começar o dia',
          items: [
            { id: 'm4', name: 'Leite Integral 1L', price: 4.50, category: 'leite' },
            { id: 'm5', name: 'Pão de Forma', price: 6.99, category: 'padaria' },
            { id: 'm6', name: 'Queijo Meia Cura', price: 14.99, category: 'frios' },
          ],
          storeId: defaultStoreId,
          active: true,
        }
      ]);
      console.log('🌱 Cardápios iniciais semeados!');
    }

  } catch (error) {
    console.error('❌ Erro no seed do banco de dados:', error);
  }
};
