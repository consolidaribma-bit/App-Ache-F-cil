import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCheck, FiClock, FiDollarSign, FiEdit2, FiSave, FiX, FiShoppingCart } from 'react-icons/fi';
import { shoppingListAPI } from '../utils/api';
import { useShoppingListStore } from '../utils/store';
import VoiceInput from '../components/VoiceInput';
import GPSRoute from '../components/GPSRoute';

import toast from 'react-hot-toast';

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

interface ShoppingList {
  id: string;
  title: string;
  items: ShoppingItem[];
  completed: boolean;
}

export default function DashboardPage() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newListName, setNewListName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', quantity: 1, price: 0 });
  const [filterAisle, setFilterAisle] = useState<{ name: string, items: string[] } | null>(null);

  const storeSetLists = useShoppingListStore((state) => state.setLists);

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    setFilterAisle(null);
  }, [selectedList?.id]);

  const fetchLists = async () => {
    try {
      const response = await shoppingListAPI.getAll();
      setLists(response.data);
      storeSetLists(response.data);
    } catch (error) {
      toast.error('Erro ao carregar listas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error('Digite um nome para a lista');
      return;
    }

    try {
      const response = await shoppingListAPI.create({ title: newListName });
      const newList = response.data;
      setLists([...lists, newList]);
      setSelectedList(newList);
      setNewListName('');
      toast.success('Lista criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar lista');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta lista?')) return;

    try {
      await shoppingListAPI.delete(listId);
      setLists(lists.filter((l) => l.id !== listId));
      if (selectedList?.id === listId) {
        setSelectedList(null);
      }
      toast.success('Lista deletada com sucesso!');
    } catch (error) {
      toast.error('Erro ao deletar lista');
    }
  };

  const handleAddItem = async () => {
    if (!selectedList || !newItemName.trim()) return;

    // Extract price from name: e.g. "feijão 20", "feijão R$ 20,50", "arroz 10 reais"
    let parsedPrice: number | undefined;
    let cleanName = newItemName.trim();

    const explicitMatch = cleanName.match(/(?:R\$?\s+)(\d+(?:[.,]\d+)?)/i) || cleanName.match(/(\d+(?:[.,]\d+)?)\s+reais/i);
    
    if (explicitMatch) {
      const raw = (explicitMatch[1] || explicitMatch[2]).replace(',', '.');
      parsedPrice = parseFloat(raw);
      cleanName = cleanName.replace(explicitMatch[0], '').trim().replace(/\s+/g, ' ');
    } else {
      const endNumberMatch = cleanName.match(/\s+(\d+(?:[.,]\d+)?)\s*$/);
      if (endNumberMatch) {
        const raw = endNumberMatch[1].replace(',', '.');
        parsedPrice = parseFloat(raw);
        cleanName = cleanName.replace(endNumberMatch[0], '').trim();
      }
    }

    if (!cleanName) cleanName = newItemName;

    const itemPayload = {
      name: cleanName,
      quantity: 1,
      unit: 'un',
      category: 'geral',
      price: parsedPrice,
    };

    try {
      const response = await shoppingListAPI.addItem(selectedList.id, itemPayload);
      // Merge parsed price into the response since backend may not return it
      const newItem = { ...response.data, price: parsedPrice ?? response.data.price };

      const updatedList = {
        ...selectedList,
        items: [...selectedList.items, newItem],
      };

      setSelectedList(updatedList);
      setLists(lists.map((l) => (l.id === selectedList.id ? updatedList : l)));
      setNewItemName('');
      toast.success('Item adicionado!');
    } catch (error) {
      toast.error('Erro ao adicionar item');
    }
  };

  const handleToggleItem = async (itemId: string, checked: boolean) => {
    if (!selectedList) return;

    try {
      const response = await shoppingListAPI.updateItem(selectedList.id, itemId, {
        checked: !checked,
      });

      const updatedList = {
        ...selectedList,
        items: selectedList.items.map((i) =>
          i.id === itemId ? response.data : i
        ),
      };

      setSelectedList(updatedList);
      setLists(lists.map((l) => (l.id === selectedList.id ? updatedList : l)));
    } catch (error) {
      toast.error('Erro ao atualizar item');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!selectedList) return;

    try {
      await shoppingListAPI.removeItem(selectedList.id, itemId);

      const updatedList = {
        ...selectedList,
        items: selectedList.items.filter((i) => i.id !== itemId),
      };

      setSelectedList(updatedList);
      setLists(lists.map((l) => (l.id === selectedList.id ? updatedList : l)));
      toast.success('Item removido!');
    } catch (error) {
      toast.error('Erro ao remover item');
    }
  };

  const handleEditClick = (item: ShoppingItem) => {
    setEditingItemId(item.id);
    setEditForm({ name: item.name, quantity: item.quantity, price: item.price || 0 });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const handleSaveEdit = async (itemId: string) => {
    if (!selectedList) return;
    try {
      const response = await shoppingListAPI.updateItem(selectedList.id, itemId, {
        name: editForm.name,
        quantity: editForm.quantity,
        price: editForm.price > 0 ? editForm.price : undefined,
      });

      const updatedList = {
        ...selectedList,
        items: selectedList.items.map((i) =>
          i.id === itemId ? response.data : i
        ),
      };

      setSelectedList(updatedList);
      setLists(lists.map((l) => (l.id === selectedList.id ? updatedList : l)));
      setEditingItemId(null);
      toast.success('Item atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar item');
    }
  };

  const handleVoiceInput = (text: string) => {
    setNewItemName(text);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card h-24 animate-pulse bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">Ache Fácil</h1>
          <p className="text-gray-600">Suas listas de compras inteligentes com GPS e voz</p>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lists Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <h2 className="font-semibold text-lg text-gray-900">Minhas Listas</h2>

              {/* New List Form */}
              <div className="card space-y-3">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
                  placeholder="Nome da nova lista"
                  className="input-field text-sm"
                />
                <button onClick={handleCreateList} className="btn-primary w-full text-sm">
                  <FiPlus className="w-4 h-4 inline mr-2" />
                  Nova Lista
                </button>
              </div>

              {/* Lists */}
              <div className="space-y-2">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedList(list)}
                    className={`w-full text-left p-4 rounded-2xl transition-all ${
                      selectedList?.id === list.id
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'bg-white border border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <p className="font-semibold">{list.title}</p>
                    <p className={`text-sm ${selectedList?.id === list.id ? 'text-primary-100' : 'text-gray-600'}`}>
                      {list.items.filter((i) => !i.checked).length} items
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedList ? (
              <div className="space-y-6">
                {/* GPS Navigation */}
                <GPSRoute 
                  items={selectedList.items} 
                  onAisleSelect={(name, items) => setFilterAisle({ name, items })}
                  onClear={() => setFilterAisle(null)}
                />

                {/* List Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center flex-wrap gap-2">
                    {selectedList.title}
                    {filterAisle && (
                      <span className="text-sm font-normal text-primary-700 bg-primary-100 px-3 py-1 rounded-full flex items-center gap-1">
                        Corredor: {filterAisle.name}
                        <button onClick={() => setFilterAisle(null)} className="ml-1 text-primary-500 hover:text-primary-800 transition-colors">
                          <FiX className="w-4 h-4" />
                        </button>
                      </span>
                    )}
                  </h2>
                  <button
                    onClick={() => handleDeleteList(selectedList.id)}
                    className="btn-secondary"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Add Item */}
                <div className="card space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                      placeholder="Digite um item ou fale..."
                      className="input-field flex-1"
                    />
                    <button onClick={handleAddItem} className="btn-primary">
                      <FiPlus className="w-5 h-5" />
                    </button>
                  </div>
                  <VoiceInput onInput={handleVoiceInput} />
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {selectedList.items
                    .filter((item) => !filterAisle || filterAisle.items.includes(item.name))
                    .map((item) => (
                    <div
                      key={item.id}
                      className="card flex items-center gap-3 hover:shadow-md transition-shadow"
                    >
                      {editingItemId === item.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="input-field flex-1 py-1 px-2 text-sm"
                            placeholder="Nome"
                          />
                          <input
                            type="number"
                            min="1"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                            className="input-field w-16 py-1 px-2 text-sm"
                            placeholder="Qtd"
                          />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                            className="input-field w-20 py-1 px-2 text-sm"
                            placeholder="Preço"
                          />
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                          >
                            <FiSave className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <FiX className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleToggleItem(item.id, item.checked)}
                            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                              item.checked
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-400 hover:bg-primary-100 hover:text-primary-600'
                            }`}
                            title={item.checked ? "Remover do carrinho" : "Adicionar ao carrinho"}
                          >
                            {item.checked ? <FiCheck className="w-5 h-5" /> : <FiShoppingCart className="w-5 h-5" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium truncate ${
                                item.checked ? 'line-through text-gray-400' : 'text-gray-900'
                              }`}
                            >
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500">{item.category}</p>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-semibold">{item.quantity}</span>
                            <span>{item.unit}</span>
                          </div>

                          {item.price && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-accent-50 rounded-lg">
                              <FiDollarSign className="w-4 h-4 text-accent-600" />
                              <span className="text-sm font-semibold text-accent-600">
                                {item.price.toFixed(2)}
                              </span>
                            </div>
                          )}

                          <button
                            onClick={() => handleEditClick(item)}
                            className="flex-shrink-0 p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <FiEdit2 className="w-5 h-5 text-blue-500" />
                          </button>

                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="flex-shrink-0 p-2 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="w-5 h-5 text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}

                  {selectedList.items.length === 0 && (
                    <div className="card text-center py-12 text-gray-500">
                      <FiClock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum item na lista</p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="card text-center">
                    <p className="text-gray-600 text-xs mb-1">Total de Itens</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {selectedList.items.length}
                    </p>
                  </div>
                  <div className="card text-center">
                    <p className="text-gray-600 text-xs mb-1">Comprados</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {selectedList.items.filter((i) => i.checked).length}
                    </p>
                  </div>
                  <div className="card text-center bg-primary-50 border-primary-100">
                    <p className="text-primary-700 text-xs mb-1 font-semibold">Total R$</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {selectedList.items
                        .reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-500 text-lg">Selecione uma lista ou crie uma nova</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
