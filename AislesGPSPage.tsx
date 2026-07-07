import { useState, useEffect } from 'react';
import { FiUploadCloud, FiMapPin, FiNavigation, FiDownload, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { storeAPI, shoppingListAPI } from '../utils/api';

// Mapa fixo dos corredores com coordenadas relativas (%) sobre o layout
const AISLE_MAP = [
  { id: 'hortifruti',  name: 'Hortifruti',       x: 18, y: 30, emoji: '🥦' },
  { id: 'laticinios',  name: 'Laticínios',        x: 10, y: 55, emoji: '🥛' },
  { id: 'carnes',      name: 'Carnes / Frios',    x: 35, y: 65, emoji: '🥩' },
  { id: 'bebidas',     name: 'Bebidas',           x: 55, y: 55, emoji: '🧃' },
  { id: 'secos',       name: 'Secos e Conservas', x: 55, y: 30, emoji: '🫙' },
  { id: 'padaria',     name: 'Padaria',           x: 80, y: 20, emoji: '🍞' },
  { id: 'limpeza',     name: 'Limpeza / Higiene', x: 80, y: 55, emoji: '🧴' },
  { id: 'caixa',       name: 'Caixa / Saída',     x: 45, y: 85, emoji: '🛒' },
];

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Lê a rota publicada pelo gerente (salva no localStorage via ManagerPage)
function getPublishedRoute(): any[] | null {
  try {
    const raw = localStorage.getItem('gps_route');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function fetchAIRoute(pendingItems: any[]) {
  if (!GEMINI_API_KEY || pendingItems.length === 0) return null;

  const prompt = `Você é um roteirizador de supermercado. O mapa de corredores é:
${JSON.stringify(AISLE_MAP.map(a => ({ id: a.id, name: a.name })))}.

Os itens de compras são: ${pendingItems.map(i => i.name).join(', ')}.

Mapeie CADA item para o 'id' do corredor mais adequado.
Retorne APENAS um JSON válido no formato:
{
  "route": [
    {
      "aisleId": "id-do-corredor",
      "items": ["nome do item 1", "nome do item 2"]
    }
  ]
}
A ordem do array "route" deve representar o melhor caminho lógico pelo supermercado.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    try { return JSON.parse(text); } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('Error fetching AI route:', err);
  }
  return null;
}

export default function AislesGPSPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedList, setSelectedList] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [hasPublishedRoute, setHasPublishedRoute] = useState(false);

  useEffect(() => {
    fetchStores();
    fetchLists();
    loadDefaultLayout();

    // ✅ Carrega rota publicada pelo gerente automaticamente
    const published = getPublishedRoute();
    if (published && published.length > 0) {
      setRouteData({ steps: published });
      setHasPublishedRoute(true);
    }
  }, []);

  const loadDefaultLayout = async () => {
    try {
      const response = await fetch('/supermarket_layout.png');
      const blob = await response.blob();
      const defaultFile = new File([blob], 'layout_supermercado.png', { type: 'image/png' });
      setFile(defaultFile);
      setPreview('/supermarket_layout.png');
    } catch { /* ignore */ }
  };

  const fetchStores = async () => {
    try {
      const response = await storeAPI.getAll();
      setStores(response.data);
      if (response.data.length > 0) setSelectedStore(response.data[0].id);
    } catch { /* ignore */ }
  };

  // Fetch lists directly — não depende do Zustand store
  const fetchLists = async () => {
    try {
      const response = await shoppingListAPI.getAll();
      setLists(response.data);
      if (response.data.length > 0) setSelectedList(response.data[0].id);
    } catch { /* ignore */ }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
      setRouteData(null);
    }
  };

  const handleUploadAndMap = async () => {
    if (!file) { toast.error('Selecione uma imagem do layout.'); return; }
    if (!selectedStore) { toast.error('Selecione o supermercado.'); return; }

    setLoading(true);
    try {
      // Upload layout (simulado)
      const formData = new FormData();
      formData.append('layout', file);
      await storeAPI.uploadLayout(selectedStore, formData);

      // Busca itens da lista selecionada (ou gera rota de demonstração)
      let pendingItems: any[] = [];

      if (selectedList) {
        try {
          const routeRes = await shoppingListAPI.getRoute(selectedList, selectedStore);
          if (routeRes.data?.steps?.length > 0) {
            const steps = routeRes.data.steps.map((s: any, idx: number) => ({
              ...s,
              emoji: ['🥦','🥛','🥩','🧃','🫙','🍞','🧴','🛒'][idx % 8],
              x: [18,10,35,55,55,80,80,45][idx % 8],
              y: [30,55,65,55,30,20,55,85][idx % 8],
            }));
            setRouteData({ steps });
            localStorage.setItem('gps_route', JSON.stringify(steps));
            toast.success('Rota gerada com sucesso!');
            return;
          }
        } catch { /* fallback abaixo */ }
      }

      // Busca itens se listSelecionada
      if (selectedList) {
        try {
          const listRes = await shoppingListAPI.getById(selectedList);
          pendingItems = (listRes.data?.items || []).filter((i: any) => !i.checked);
        } catch { /* ignore */ }
      }

      let steps: any[] = [];
      const aiRoute = await fetchAIRoute(pendingItems);
      
      if (aiRoute && aiRoute.route) {
        // Mapeia resposta da IA para o formato esperado
        steps = aiRoute.route.map((r: any) => {
          const mapData = AISLE_MAP.find(a => a.id === r.aisleId) || AISLE_MAP[0];
          return {
            aisleId: mapData.id,
            aisleName: mapData.name,
            emoji: mapData.emoji,
            x: mapData.x,
            y: mapData.y,
            items: r.items.map((name: string) => ({ name }))
          };
        });
      } else {
        // Fallback para demonstração ou dist. básica
        steps = AISLE_MAP.slice(0, pendingItems.length > 0 ? undefined : 5).map((aisle, idx) => ({
          aisleId: aisle.id,
          aisleName: aisle.name,
          emoji: aisle.emoji,
          x: aisle.x,
          y: aisle.y,
          items: pendingItems.length > 0
            ? pendingItems.filter((_: any, i: number) => i % AISLE_MAP.length === idx)
            : [{ name: '(demonstração)' }],
        })).filter(s => s.items.length > 0);
      }

      setRouteData({ steps });
      localStorage.setItem('gps_route', JSON.stringify(steps));
      toast.success('Rota traçada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!routeData) return;
    const text = routeData.steps
      .map((s: any, i: number) => `${i + 1}. ${s.emoji} ${s.aisleName}\n   Itens: ${s.items.map((x: any) => x.name).join(', ')}`)
      .join('\n\n');
    const blob = new Blob([`ROTA DE COMPRAS\n\n${text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'rota_compras.txt'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Rota baixada!');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2 flex items-center gap-3">
            <FiMapPin /> GPS Corredores
          </h1>
          <p className="text-gray-600">Faça upload da planta do supermercado e deixe-nos traçar a melhor rota para suas compras.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Painel de controles ── */}
          <div className="space-y-5 lg:col-span-1">
            {/* Banner: rota publicada pelo gerente */}
            {hasPublishedRoute && (
              <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                <FiCheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-green-800 text-sm">Rota ativa pelo gerente</p>
                  <p className="text-xs text-green-600">O mapa deste supermercado já foi configurado. Use a rota abaixo ou traçe a sua própria!</p>
                </div>
              </div>
            )}

            <div className="card space-y-4">
              <h2 className="font-semibold text-lg">1. Selecione o Local</h2>
              <select className="input-field w-full" value={selectedStore} onChange={e => setSelectedStore(e.target.value)}>
                {stores.length === 0 && <option value="">Carregando...</option>}
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <h2 className="font-semibold text-lg pt-2">2. Selecione a Lista</h2>
              <select className="input-field w-full" value={selectedList} onChange={e => setSelectedList(e.target.value)}>
                <option value="">-- Gerar rota de demo --</option>
                {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
              {lists.length === 0 && (
                <p className="text-xs text-gray-400 -mt-2">Nenhuma lista encontrada. A rota será gerada com dados de demonstração.</p>
              )}

              <h2 className="font-semibold text-lg pt-2">3. Layout do Mercado</h2>
              <div className="border-2 border-dashed border-primary-300 rounded-xl p-4 text-center hover:bg-primary-50/30 transition-colors cursor-pointer">
                <input type="file" id="layout-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                <label htmlFor="layout-upload" className="cursor-pointer flex flex-col items-center gap-1">
                  <FiUploadCloud className="w-7 h-7 text-primary-500" />
                  <span className="text-sm font-medium text-gray-700 truncate max-w-full">
                    {file ? file.name : 'Clique para enviar a planta'}
                  </span>
                  {file && <span className="text-xs text-primary-500">Clique para trocar</span>}
                </label>
              </div>

              <button
                onClick={handleUploadAndMap}
                disabled={loading || !file}
                className="btn-primary w-full mt-2 flex items-center justify-center gap-2 py-3 text-base"
              >
                {loading
                  ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Analisando...</>
                  : <><FiNavigation className="w-5 h-5" /> Traçar Rota</>
                }
              </button>
            </div>

            {/* ── Lista de passos da rota ── */}
            {routeData && (
              <div className="card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FiCheckCircle className="text-primary-500" /> Ordem de Coleta
                  </h3>
                  <button onClick={handleDownload} className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors" title="Baixar Rota">
                    <FiDownload className="w-5 h-5" />
                  </button>
                </div>
                <ol className="space-y-2 text-sm text-gray-700">
                  {routeData.steps.map((step: any, index: number) => (
                    <li key={index} className="flex gap-3 items-start pb-2 border-b border-gray-100 last:border-0">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold">{index + 1}</span>
                      <div>
                        <span className="font-semibold text-primary-700">{step.emoji} {step.aisleName}</span>
                        <br />
                        <span className="text-gray-500 text-xs">{step.items.map((i: any) => i.name).join(', ')}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* ── Visualizador do mapa ── */}
          <div className="lg:col-span-2">
            <div className="card min-h-[500px] flex flex-col items-center justify-center overflow-hidden relative p-2">
              {!preview ? (
                <div className="text-center text-gray-400 py-20">
                  <FiMapPin className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <p>A imagem do layout aparecerá aqui.</p>
                </div>
              ) : (
                <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                  <img src={preview} alt="Layout" className="w-full h-full object-contain rounded-xl" />

                  {/* ── SVG de rota sobreposta ── */}
                  {routeData && (
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      {/* Linha de rota conectando os pontos */}
                      <polyline
                        points={routeData.steps.map((s: any) => `${s.x},${s.y}`).join(' ')}
                        fill="none"
                        stroke="#1a8917"
                        strokeWidth="1.2"
                        strokeDasharray="3 2"
                        opacity="0.9"
                      />
                      {/* Pontos em cada corredor */}
                      {routeData.steps.map((step: any, i: number) => (
                        <g key={i}>
                          {/* Halo */}
                          <circle cx={step.x} cy={step.y} r="3.5" fill="rgba(26,137,23,0.20)" />
                          {/* Ponto principal */}
                          <circle cx={step.x} cy={step.y} r="2.2" fill="#ff6b35" stroke="white" strokeWidth="0.6" />
                          {/* Número */}
                          <text x={step.x} y={step.y - 3.8} textAnchor="middle" fontSize="2.8" fill="#1a8917" fontWeight="bold">
                            {i + 1}
                          </text>
                          {/* Label corredor */}
                          <text x={step.x} y={step.y + 5.5} textAnchor="middle" fontSize="2" fill="#1a4a1a" fontWeight="600">
                            {step.aisleName.split(' ')[0]}
                          </text>
                        </g>
                      ))}
                    </svg>
                  )}

                  {routeData && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg shadow text-xs font-bold text-primary-700 flex items-center gap-1">
                      <FiCheckCircle className="text-primary-500" /> Rota Ativa
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
