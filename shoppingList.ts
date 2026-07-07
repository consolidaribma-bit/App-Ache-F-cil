import express, { Router, Request, Response } from 'express';
import { mockDB } from '../services/MockDatabase';

const router: Router = express.Router();

// Get all lists for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get userId from auth header or params
    const userId = req.query.userId as string;
    
    if (!userId) {
      const allLists = mockDB.getAllShoppingLists();
      return res.json(allLists);
    }

    const lists = mockDB.getShoppingListsByUserId(userId);
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar listas de compras' });
  }
});

// Get list by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const list = mockDB.getShoppingListById(id);

    if (!list) {
      return res.status(404).json({ message: 'Lista não encontrada' });
    }

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar lista de compras' });
  }
});

// Create list
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, user_id, store_id } = req.body;

    if (!title || !user_id) {
      return res.status(400).json({ message: 'Título e user_id são obrigatórios' });
    }

    const list = mockDB.createShoppingList({
      user_id,
      title,
      items: [],
      store_id,
      completed: false,
    });

    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar lista de compras' });
  }
});

// Update list
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const list = mockDB.updateShoppingList(id, updates);

    if (!list) {
      return res.status(404).json({ message: 'Lista não encontrada' });
    }

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar lista de compras' });
  }
});

// Add item to list
router.post('/:id/items', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { product_name, quantity, unit } = req.body;

    const list = mockDB.getShoppingListById(id);
    if (!list) {
      return res.status(404).json({ message: 'Lista não encontrada' });
    }

    const newItem = {
      id: Math.random().toString(),
      product_name,
      quantity: quantity || 1,
      unit: unit || 'un',
      checked: false,
    };

    list.items.push(newItem);
    const updated = mockDB.updateShoppingList(id, list);

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar item' });
  }
});

// Update item in list
router.put('/:id/items/:itemId', async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const updates = req.body;

    const list = mockDB.getShoppingListById(id);
    if (!list) {
      return res.status(404).json({ message: 'Lista não encontrada' });
    }

    const itemIndex = list.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item não encontrado' });
    }

    list.items[itemIndex] = { ...list.items[itemIndex], ...updates };
    mockDB.updateShoppingList(id, list);

    res.json(list.items[itemIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar item' });
  }
});

// Delete item from list
router.delete('/:id/items/:itemId', async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;

    const list = mockDB.getShoppingListById(id);
    if (!list) {
      return res.status(404).json({ message: 'Lista não encontrada' });
    }

    const itemIndex = list.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item não encontrado' });
    }

    list.items.splice(itemIndex, 1);
    mockDB.updateShoppingList(id, list);

    res.json({ message: 'Item removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover item' });
  }
});

// Delete list
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = mockDB.deleteShoppingList(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Lista não encontrada' });
    }

    res.json({ message: 'Lista removida com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover lista' });
  }
});

export default router;
