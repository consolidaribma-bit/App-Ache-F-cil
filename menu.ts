import express, { Router, Request, Response } from 'express';
import { mockDB } from '../services/MockDatabase';

const router: Router = express.Router();

// Get all menus
router.get('/', async (req: Request, res: Response) => {
  try {
    const menus = mockDB.getAllMenus();
    res.json(menus);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar cardápios' });
  }
});

// Get menus by store
router.get('/store/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const menus = mockDB.getMenusByStoreId(storeId);
    res.json(menus);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar cardápios da loja' });
  }
});

export default router;
