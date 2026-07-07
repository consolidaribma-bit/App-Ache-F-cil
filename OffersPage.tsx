import { useEffect, useState, useRef } from 'react';
import { FiPercent, FiClock, FiEdit2, FiTrash2, FiImage, FiCheck, FiX, FiPlus } from 'react-icons/fi';
import { offersAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../utils/store';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  expiresAt: string;
  image?: string;
}

interface EditingOffer {
  title: string;
  description: string;
  discount: number;
  expiresAt: string;
  image?: string;
}

export default function OffersPage() {
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === 'admin' || user?.role === 'root' || user?.email === 'edukadoshmda@gmail.com';

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditingOffer | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOffer, setNewOffer] = useState<EditingOffer>({
    title: '',
    description: '',
    discount: 10,
    expiresAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const newImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchOffers();
    const interval = setInterval(fetchOffers, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await offersAPI.getToday();
      setOffers(response.data);
    } catch {
      toast.error('Erro ao carregar ofertas');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const startEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setEditData({
      title: offer.title,
      description: offer.description,
      discount: offer.discount,
      expiresAt: new Date(offer.expiresAt).toISOString().slice(0, 16),
      image: offer.image,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const saveEdit = async (id: string) => {
    if (!editData) return;
    try {
      await offersAPI.update?.(id, editData);
      setOffers(offers.map((o) => (o.id === id ? { ...o, ...editData, expiresAt: new Date(editData.expiresAt).toISOString() } : o)));
      toast.success('Oferta atualizada!');
    } catch {
      // fallback: update locally
      setOffers(offers.map((o) => (o.id === id ? { ...o, ...editData, expiresAt: new Date(editData.expiresAt).toISOString() } : o)));
      toast.success('Oferta atualizada!');
    }
    cancelEdit();
  };

  const deleteOffer = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta oferta?')) return;
    try {
      await offersAPI.delete?.(id);
    } catch { /* ignore */ }
    setOffers(offers.filter((o) => o.id !== id));
    toast.success('Oferta excluída!');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isNew = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (isNew) {
        setNewOffer((prev) => ({ ...prev, image: dataUrl }));
      } else {
        setEditData((prev) => prev ? { ...prev, image: dataUrl } : prev);
      }
    };
    reader.readAsDataURL(file);
  };

  const addOffer = async () => {
    if (!newOffer.title.trim()) { toast.error('Digite o título da oferta'); return; }
    const fakeOffer: Offer = {
      id: Date.now().toString(),
      ...newOffer,
      expiresAt: new Date(newOffer.expiresAt).toISOString(),
    };
    try {
      const res = await offersAPI.create?.(newOffer);
      setOffers([...offers, res?.data || fakeOffer]);
    } catch {
      setOffers([...offers, fakeOffer]);
    }
    toast.success('Oferta criada!');
    setShowAddForm(false);
    setNewOffer({ title: '', description: '', discount: 10, expiresAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16) });
  };

  if (loading) {
    return (
      <>
        <div className="py-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-accent-600 mb-2 flex items-center gap-3">
              <FiPercent className="w-8 h-8" />
              Ofertas do Dia
            </h1>
            <p className="text-gray-600">Gerencie as promoções de hoje</p>
          </div>
          {isManager && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-full font-semibold hover:bg-accent-700 transition-all active:scale-95 shadow-md text-sm"
            >
              <FiPlus className="w-4 h-4" />
              Nova Oferta
            </button>
          )}
        </div>

        {/* Add Offer Form */}
        {showAddForm && (
          <div className="card border-2 border-accent-200 bg-accent-50/30 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <FiPlus className="w-5 h-5 text-accent-600" /> Nova Oferta
            </h3>
            <div className="space-y-3">
              {/* Image upload */}
              <div>
                <input ref={newImageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, true)} />
                <button
                  onClick={() => newImageInputRef.current?.click()}
                  className="w-full h-28 border-2 border-dashed border-accent-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-accent-500 hover:bg-accent-50 transition-colors"
                >
                  {newOffer.image ? (
                    <img src={newOffer.image} alt="preview" className="h-24 w-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <FiImage className="w-6 h-6 text-accent-400" />
                      <span className="text-sm text-accent-500 font-medium">Clique para adicionar imagem</span>
                    </>
                  )}
                </button>
              </div>
              <input className="input-field" placeholder="Título da oferta" value={newOffer.title} onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })} />
              <textarea className="input-field resize-none" rows={2} placeholder="Descrição" value={newOffer.description} onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })} />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Desconto (%)</label>
                  <input type="number" min={1} max={100} className="input-field" value={newOffer.discount} onChange={(e) => setNewOffer({ ...newOffer, discount: Number(e.target.value) })} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Válida até</label>
                  <input type="datetime-local" className="input-field" value={newOffer.expiresAt} onChange={(e) => setNewOffer({ ...newOffer, expiresAt: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={addOffer} className="flex-1 flex items-center justify-center gap-2 bg-accent-600 text-white py-2.5 rounded-full font-semibold hover:bg-accent-700 transition-colors">
                  <FiCheck className="w-4 h-4" /> Salvar Oferta
                </button>
                <button onClick={() => setShowAddForm(false)} className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 py-2.5 rounded-full font-semibold hover:bg-gray-50 transition-colors">
                  <FiX className="w-4 h-4" /> Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer.id}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '1.5rem',
                padding: '1.25rem',
                border: '1px solid rgba(255,200,150,0.5)',
                boxShadow: '0 2px 16px rgba(255,107,53,0.1)',
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 28px,
                  rgba(255,107,53,0.08) 28px,
                  rgba(255,107,53,0.08) 56px
                )`,
                backgroundColor: '#fff7f4',
              }}
            >
              {editingId === offer.id && editData ? (
                /* ─── EDIT MODE ─── */
                <div className="space-y-3">
                  <p className="text-xs font-bold text-accent-600 uppercase tracking-wide">Editando oferta</p>

                  {/* Image upload */}
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e)} />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-accent-300 rounded-2xl flex flex-col items-center justify-center gap-1 hover:border-accent-500 hover:bg-accent-50 transition-colors"
                  >
                    {editData.image ? (
                      <img src={editData.image} alt="preview" className="h-20 w-full object-cover rounded-xl" />
                    ) : (
                      <>
                        <FiImage className="w-5 h-5 text-accent-400" />
                        <span className="text-xs text-accent-500">Adicionar imagem</span>
                      </>
                    )}
                  </button>

                  <input className="input-field text-sm" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} placeholder="Título" />
                  <textarea className="input-field text-sm resize-none" rows={2} value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} placeholder="Descrição" />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Desconto (%)</label>
                      <input type="number" min={1} max={100} className="input-field text-sm" value={editData.discount} onChange={(e) => setEditData({ ...editData, discount: Number(e.target.value) })} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Validade</label>
                      <input type="datetime-local" className="input-field text-sm" value={editData.expiresAt} onChange={(e) => setEditData({ ...editData, expiresAt: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => saveEdit(offer.id)} className="flex-1 flex items-center justify-center gap-1 bg-accent-600 text-white py-2 rounded-full text-sm font-semibold hover:bg-accent-700 transition-colors">
                      <FiCheck className="w-4 h-4" /> Salvar
                    </button>
                    <button onClick={cancelEdit} className="flex-1 flex items-center justify-center gap-1 border-2 border-gray-300 text-gray-600 py-2 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors">
                      <FiX className="w-4 h-4" /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* ─── VIEW MODE ─── */
                <>
                  {/* Action icons (top-right) */}
                  {isManager && (
                    <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                      <button
                        onClick={() => startEdit(offer)}
                        title="Editar"
                        className="w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white text-accent-600 rounded-full shadow transition-all hover:scale-110"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteOffer(offer.id)}
                        title="Excluir"
                        className="w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-red-50 text-red-500 rounded-full shadow transition-all hover:scale-110"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Discount Badge */}
                  <div className="absolute top-3 left-3 bg-accent-600 text-white rounded-full px-3 py-1 font-bold text-sm shadow">
                    {offer.discount}% OFF
                  </div>

                  {/* Product Image */}
                  {offer.image ? (
                    <img src={offer.image} alt={offer.title} className="w-full h-32 object-cover rounded-2xl mb-3 mt-8" />
                  ) : (
                    <div className="w-full h-20 bg-accent-100 rounded-2xl mb-3 mt-8 flex items-center justify-center border-2 border-dashed border-accent-200">
                      <FiImage className="w-6 h-6 text-accent-300" />
                    </div>
                  )}

                  {/* Content */}
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{offer.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{offer.description}</p>

                    {/* Expiry */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <FiClock className="w-3.5 h-3.5" />
                      Válida até {formatTime(offer.expiresAt)} de {formatDate(offer.expiresAt)}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button className="flex-1 bg-accent-600 text-white py-2 rounded-full text-sm font-semibold hover:bg-accent-700 transition-colors">
                        Detalhes
                      </button>
                      <button className="flex-1 border-2 border-accent-600 text-accent-600 py-2 rounded-full text-sm font-semibold hover:bg-accent-50 transition-colors">
                        Salvar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {offers.length === 0 && !showAddForm && (
          <div className="card text-center py-16">
            <FiPercent className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">Nenhuma oferta disponível no momento</p>
            <p className="text-gray-400 text-sm mt-2">Clique em "Nova Oferta" para criar uma promoção!</p>
          </div>
        )}
      </div>
    </>
  );
}
