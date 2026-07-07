import { useState, useEffect } from 'react';
import { FiShield, FiUsers, FiShoppingBag, FiActivity, FiTrash2, FiPlus, FiCheck } from 'react-icons/fi';
import { authAPI, storeAPI } from '../utils/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  supermarket?: string;
  role: 'root' | 'admin' | 'user';
  createdAt: string;
}

interface Store {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
}

export default function RootPanelPage() {
  const [stats, setStats] = useState({ users: 0, supermarkets: 0, activeSessions: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'stores'>('users');
  const [loading, setLoading] = useState(true);

  // Form states for creating a new store
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('');
  const [newStoreState, setNewStoreState] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, storesRes] = await Promise.all([
        authAPI.getStats(),
        authAPI.getUsers(),
        storeAPI.getAll(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setStores(storesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados do painel root');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await authAPI.updateUserRole(userId, newRole);
      toast.success('Permissão atualizada com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar permissão');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja remover este usuário?')) return;
    try {
      await authAPI.deleteUser(userId);
      toast.success('Usuário removido com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao remover usuário');
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!window.confirm('Tem certeza que deseja remover este supermercado?')) return;
    try {
      await storeAPI.delete(storeId);
      toast.success('Supermercado removido com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao remover supermercado');
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      toast.error('Nome do supermercado é obrigatório');
      return;
    }

    try {
      await storeAPI.create({
        name: newStoreName,
        address: newStoreAddress,
        city: newStoreCity,
        state: newStoreState,
        phone: newStorePhone,
      });
      toast.success('Supermercado cadastrado com sucesso!');
      setShowAddStore(false);
      // Reset form
      setNewStoreName('');
      setNewStoreAddress('');
      setNewStoreCity('');
      setNewStoreState('');
      setNewStorePhone('');
      fetchData();
    } catch (error) {
      toast.error('Erro ao cadastrar supermercado');
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Carregando painel administrativo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shadow-inner">
              <FiShield className="text-red-600 w-6 h-6" />
            </div>
            Painel Root
          </h1>
          <p className="text-gray-500 mt-1">Central de controle mestre do Ache Fácil.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="card bg-white/70 flex items-center gap-4 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
            <FiUsers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Usuários</p>
            <p className="text-2xl font-bold text-gray-800">{stats.users}</p>
          </div>
        </div>
        <div className="card bg-white/70 flex items-center gap-4 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
            <FiShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Supermercados</p>
            <p className="text-2xl font-bold text-gray-800">{stats.supermarkets}</p>
          </div>
        </div>
        <div className="card bg-white/70 flex items-center gap-4 hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
            <FiActivity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Sessões / Listas</p>
            <p className="text-2xl font-bold text-gray-800">{stats.activeSessions}</p>
          </div>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all duration-200 ${
            activeTab === 'users'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiUsers className="w-4 h-4" />
          Usuários
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all duration-200 ${
            activeTab === 'stores'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiShoppingBag className="w-4 h-4" />
          Supermercados
        </button>
      </div>

      {/* Active Tab Content */}
      <div className="card min-h-[300px]">
        {activeTab === 'users' ? (
          <div className="space-y-4">
            <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2 mb-2">
              <FiUsers className="text-primary-500" /> Gerenciar Usuários
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase">
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Nível</th>
                    <th className="py-3 px-4">Supermercado</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">{u.name}</td>
                      <td className="py-3.5 px-4 text-gray-500">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2.5 py-1 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                        >
                          <option value="user">Usuário (User)</option>
                          <option value="admin">Gerente (Admin)</option>
                          <option value="root">Mestre (Root)</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">{u.supermarket || '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-full hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                          title="Remover Usuário"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        Nenhum usuário cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <FiShoppingBag className="text-primary-500" /> Gerenciar Supermercados
              </h2>
              <button
                onClick={() => setShowAddStore(!showAddStore)}
                className="btn-primary py-2 text-sm flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Adicionar Supermercado
              </button>
            </div>

            {/* Add store collapsible form */}
            {showAddStore && (
              <form onSubmit={handleAddStore} className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-4 max-w-lg">
                <h3 className="font-semibold text-gray-800 text-sm">Novo Supermercado</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500">Nome *</label>
                    <input
                      type="text"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      placeholder="Supermercado Central"
                      className="input-field w-full text-sm mt-1"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500">Endereço</label>
                    <input
                      type="text"
                      value={newStoreAddress}
                      onChange={(e) => setNewStoreAddress(e.target.value)}
                      placeholder="Av. Principal, 123"
                      className="input-field w-full text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Cidade</label>
                    <input
                      type="text"
                      value={newStoreCity}
                      onChange={(e) => setNewStoreCity(e.target.value)}
                      placeholder="São Paulo"
                      className="input-field w-full text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Estado</label>
                    <input
                      type="text"
                      value={newStoreState}
                      onChange={(e) => setNewStoreState(e.target.value)}
                      placeholder="SP"
                      className="input-field w-full text-sm mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500">Telefone</label>
                    <input
                      type="text"
                      value={newStorePhone}
                      onChange={(e) => setNewStorePhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="input-field w-full text-sm mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddStore(false)}
                    className="btn-secondary py-1.5 px-3 text-xs"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
                    <FiCheck className="w-3.5 h-3.5" />
                    Salvar
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase">
                    <th className="py-3 px-4">Supermercado</th>
                    <th className="py-3 px-4">Endereço</th>
                    <th className="py-3 px-4">Cidade / UF</th>
                    <th className="py-3 px-4">Telefone</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {stores.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">{s.name}</td>
                      <td className="py-3.5 px-4 text-gray-500">{s.address || '-'}</td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {s.city ? `${s.city} - ${s.state || ''}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">{s.phone || '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteStore(s.id)}
                          className="p-1.5 rounded-full hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                          title="Remover Supermercado"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {stores.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        Nenhum supermercado cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
