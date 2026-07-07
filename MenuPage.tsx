import { useState, useEffect } from 'react';
import { FiShoppingCart, FiTag, FiPlus, FiList, FiCheckCircle } from 'react-icons/fi';
import Accordion from '../components/Accordion';
import AISuggestion from '../components/AISuggestion';
import { menuAPI, shoppingListAPI } from '../utils/api';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

interface MenuData {
  id: string;
  title: string;
  description?: string;
  items: MenuItem[];
  active: boolean;
}

export default function MenuPage() {
  const [menus, setMenus] = useState<MenuData[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [creatingList, setCreatingList] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menusRes, listsRes] = await Promise.all([
        menuAPI.getAll(),
        shoppingListAPI.getAll(),
      ]);
      setMenus(menusRes.data || []);
      const listsData = listsRes.data || [];
      setLists(listsData);
      if (listsData.length > 0) {
        setSelectedListId(listsData[0].id);
      }
    } catch (error) {
      toast.error('Erro ao carregar cardápios ou listas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    setCreatingList(true);
    try {
      const title = `Lista ${new Date().toLocaleDateString('pt-BR')}`;
      const res = await shoppingListAPI.create({ title });
      const newList = res.data;
      setLists([...lists, newList]);
      setSelectedListId(newList.id);
      toast.success(`Lista "${title}" criada com sucesso!`);
    } catch (error) {
      toast.error('Erro ao criar nova lista');
    } finally {
      setCreatingList(false);
    }
  };

  const handleAddItemToList = async (item: MenuItem) => {
    let targetListId = selectedListId;

    if (!targetListId) {
      // Auto-create list if none exists
      try {
        const title = 'Minha Lista de Compras';
        const res = await shoppingListAPI.create({ title });
        const newList = res.data;
        setLists([newList]);
        setSelectedListId(newList.id);
        targetListId = newList.id;
        toast.success(`Criada a lista: "${title}"`);
      } catch (error) {
        toast.error('Erro ao criar lista automaticamente');
        return;
      }
    }

    try {
      const itemPayload = {
        name: item.name,
        quantity: 1,
        unit: 'un',
        category: item.category || 'geral',
        price: item.price,
      };
      await shoppingListAPI.addItem(targetListId, itemPayload);
      toast.success(`"${item.name}" adicionado à lista!`);
    } catch (error) {
      toast.error('Erro ao adicionar item à lista');
    }
  };

  // Extract unique categories dynamically
  const categories = [
    'all',
    ...Array.from(
      new Set(
        menus
          .flatMap((menu) => menu.items || [])
          .map((item) => item.category?.toLowerCase().trim())
          .filter(Boolean)
      )
    ),
  ];

  if (loading) {
    return (
      <div className="py-8 space-y-4 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Get all active product names for AI recommendations
  const allProductNames = menus.flatMap((m) => (m.items || []).map((i) => i.name));

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-4xl font-bold text-primary-600 mb-2 flex items-center gap-3">
            <FiShoppingCart className="w-8 h-8" />
            Cardápios
          </h1>
          <p className="text-gray-500">Explore produtos e crie seu cardápio ideal.</p>
        </div>

        {/* Shopping List Quick Selection */}
        <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <FiList className="text-primary-500 w-5 h-5 shrink-0" />
          <div className="text-left">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Adicionar à Lista
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              {lists.length > 0 ? (
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="text-xs font-semibold text-gray-700 bg-transparent border-none focus:ring-0 focus:outline-none p-0 pr-8 cursor-pointer"
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.title}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-gray-400 italic">Sem listas ativas</span>
              )}
              <button
                onClick={handleCreateList}
                disabled={creatingList}
                className="p-1 rounded-full bg-primary-50 hover:bg-primary-100 text-primary-600 transition-colors"
                title="Nova Lista"
              >
                <FiPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestion */}
      {allProductNames.length > 0 && (
        <AISuggestion availableProducts={allProductNames} />
      )}

      {/* Category Filter Pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${
                selectedCategory === cat
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Accordion Views */}
      <div className="space-y-4">
        {menus.map((menu) => {
          // Filter items of this menu
          const filteredItems = (menu.items || []).filter(
            (item) =>
              selectedCategory === 'all' ||
              item.category?.toLowerCase() === selectedCategory
          );

          if (filteredItems.length === 0 && selectedCategory !== 'all') {
            return null; // Hide categories with no matching items when filter active
          }

          return (
            <Accordion key={menu.id} title={menu.title} defaultOpen={true}>
              <div className="space-y-3">
                {menu.description && (
                  <p className="text-sm text-gray-500 italic mb-3">{menu.description}</p>
                )}

                <div className="divide-y divide-gray-50">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-4 group"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-800 text-base">{item.name}</h4>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full">
                            R$ {item.price.toFixed(2)}
                          </span>
                          {item.category && (
                            <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                              <FiTag className="w-2.5 h-2.5" />
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddItemToList(item)}
                        className="flex items-center justify-center p-2.5 rounded-2xl bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white transition-all duration-200 active:scale-95 shadow-sm hover:shadow"
                        title="Adicionar à Lista"
                      >
                        <FiPlus className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  {filteredItems.length === 0 && (
                    <p className="text-sm text-gray-400 py-4 text-center">
                      Nenhum item nesta categoria.
                    </p>
                  )}
                </div>
              </div>
            </Accordion>
          );
        })}

        {menus.length === 0 && (
          <div className="card text-center py-12 text-gray-400">
            <FiShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum cardápio disponível no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
