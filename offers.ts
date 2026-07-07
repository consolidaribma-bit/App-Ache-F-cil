import express, { Router, Request, Response } from 'express';
import { mockDB } from '../services/MockDatabase';

const router: Router = express.Router();

// Get all offers
router.get('/', async (req: Request, res: Response) => {
  try {
    const offers = mockDB.getAllOffers();
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar ofertas' });
  }
});

// Get offers by store
router.get('/store/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const offers = mockDB.getOffersByStoreId(storeId);
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar ofertas da loja' });
  }
});

export default router;
