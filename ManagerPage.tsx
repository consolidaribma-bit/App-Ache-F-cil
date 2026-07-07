import { useState, useEffect } from 'react';
import { FiUploadCloud, FiMapPin, FiNavigation, FiDownload, FiCheckCircle, FiSettings, FiLock, FiTrash2, FiRefreshCw, FiFileText } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { storeAPI, shoppingListAPI } from '../utils/api';
import { useAuthStore } from '../utils/store';

// Mapa fixo dos corredores
const AISLE_MAP = [
  { id: 'hortifruti',  name: 'Hortifruti',       x: 18, y: 30, emoji: '🥦' },
  { id: 'laticinios',  name: 'Laticínios',        x: 10, y: 55, emoji: '🥛' },
  { id: 'carnes',      name: 'Carnes / Frios',    x: 35, y: 65, emoji: '🥩' },
  { id: 'bebidas',     name: 'Bebidas',            x: 55, y: 55, emoji: '🧃' },
  { id: 'secos',       name: 'Secos e Conservas', x: 55, y: 30, emoji: '🫙' },
  { id: 'padaria',     name: 'Padaria',            x: 80, y: 20, emoji: '🍞' },
  { id: 'limpeza',     name: 'Limpeza / Higiene', x: 80, y: 55, emoji: '🧴' },
  { id: 'caixa',       name: 'Caixa / Saída',     x: 45, y: 85, emoji: '🛒' },
];

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

async function fetchAIRoute(pendingItems: any[], spreadsheetData: any[] = []) {
  if (pendingItems.length === 0) return null;
  
  if (!GEMINI_API_KEY) {
    console.warn("Sem chave API configurada. Retornando rota simulada.");
    return {
      route: [
        { aisleId: 'hortifruti', items: ['Banana'] },
        { aisleId: 'secos', items: ['Arroz'] },
        { aisleId: 'padaria', items: ['Pão de forma'] },
        { aisleId: 'carnes', items: ['Frango'] },
        { aisleId: 'laticinios', items: ['Leite'] },
        { aisleId: 'bebidas', items: ['Cerveja'] },
        { aisleId: 'limpeza', items: ['Detergente'] },
        { aisleId: 'caixa', items: ['Pagamento'] }
      ]
    };
  }

  let extraInfo = '';
  if (spreadsheetData.length > 0) {
    extraInfo = `\nAbaixo estão as informações da planilha oficial da loja. Use-as como referência para localizar os itens nos corredores:\n${JSON.stringify(spreadsheetData.slice(0, 200))}`;
  }

  const prompt = `Você é um roteirizador de supermercado. O mapa de corredores é:
${JSON.stringify(AISLE_MAP.map(a => ({ id: a.id, name: a.name })))}.
Os itens de compras são: ${pendingItems.map(i => i.name).join(', ')}.
${extraInfo}
Mapeie CADA item para o 'id' do corredor mais adequado.
Retorne APENAS um JSON válido no formato:
{"route":[{"aisleId":"id-do-corredor","items":["nome do item 1"]}]}
A ordem deve representar o melhor caminho lógico pelo supermercado.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }], 
          generationConfig: { 
            temperature: 0.1,
            responseMimeType: "application/json"
          } 
        }),
      }
    );
    const data = await response.json();
    
    if (data.error) {
      console.error("Erro da API Gemini:", data.error);
      throw new Error(data.error.message);
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    try {
      return JSON.parse(text);
    } catch (e) {
      // Tenta extrair com regex caso não seja JSON puro
      const m = text.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    }
  } catch (err: any) { 
    console.error("Erro na requisição da IA:", err);
    // Para não quebrar a tela, caímos no fallback, mas avisamos o erro no console
  }
  
  // Fallback inteligente caso a API falhe mesmo com chave
  const routeMap = new Map<string, string[]>();
  pendingItems.forEach(item => {
    const name = item.name.toLowerCase();
    let aisle = 'secos';
    if (name.includes('banana') || name.includes('maçã')) aisle = 'hortifruti';
    else if (name.includes('leite') || name.includes('queijo') || name.includes('manteiga')) aisle = 'laticinios';
    else if (name.includes('frango') || name.includes('carne') || name.includes('peixe')) aisle = 'carnes';
    else if (name.includes('pão') || name.includes('bolo')) aisle = 'padaria';
    else if (name.includes('cerveja') || name.includes('refrigerante') || name.includes('suco')) aisle = 'bebidas';
    else if (name.includes('detergente') || name.includes('sabão')) aisle = 'limpeza';
    
    if (!routeMap.has(aisle)) routeMap.set(aisle, []);
    routeMap.get(aisle)!.push(item.name);
  });

  return {
    route: Array.from(routeMap.entries()).map(([aisleId, items]) => ({ aisleId, items }))
  };
}

export default function ManagerPage() {
  const user = useAuthStore(state => state.user);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [routePreview, setRoutePreview] = useState<any>(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);

  const isManager = user?.role === 'admin' || user?.role === 'root' || user?.email === 'edukadoshmda@gmail.com';

  useEffect(() => {
    if (!isManager) return;
    fetchStores();
    // Simula contagem de usuários ativos
    setActiveUsers(Math.floor(Math.random() * 20) + 1);
    // Carrega layout salvo
    const saved = localStorage.getItem('manager_layout_preview');
    if (saved) setPreview(saved);
  }, [isManager]);

  const fetchStores = async () => {
    try {
      const res = await storeAPI.getAll();
      const list = res.data || [];
      setStores(list);
      if (list.length > 0) setSelectedStore(list[0].id);
    } catch { /* ignore */ }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setPreview(url);
      localStorage.setItem('manager_layout_preview', url);
    };
    reader.readAsDataURL(f);
  };

  const handleSpreadsheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSpreadsheetFile(f);
    
    try {
      const data = await f.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(firstSheet);
      setParsedProducts(json);
      toast.success(`Planilha carregada: ${json.length} itens encontrados.`);
    } catch (err) {
      toast.error('Erro ao ler a planilha. Formato inválido.');
      setSpreadsheetFile(null);
    }
  };

  const handleClearSpreadsheet = () => {
    setSpreadsheetFile(null);
    setParsedProducts([]);
    toast.success('Planilha removida.');
  };

  const handlePreviewRoute = async () => {
    if (!selectedStore) { toast.error('Selecione o supermercado.'); return; }
    setLoading(true);
    toast.loading('Gerando prévia da rota com IA...', { id: 'mgr-route' });
    try {
      // Usa itens de exemplo para prévia
      const exampleItems = [
        { name: 'Banana' }, { name: 'Leite' }, { name: 'Arroz' },
        { name: 'Frango' }, { name: 'Cerveja' }, { name: 'Pão de forma' },
        { name: 'Detergente' }
      ];
      const aiRoute = await fetchAIRoute(exampleItems, parsedProducts);
      if (aiRoute?.route) {
        // Agrupa corredores iguais para não repetir visualmente
        const groupedSteps: any[] = [];
        aiRoute.route.forEach((r: any) => {
          const existing = groupedSteps.find(s => s.aisleId === r.aisleId);
          if (existing) {
            existing.items.push(...r.items.map((n: string) => ({ name: n })));
          } else {
            const mapData = AISLE_MAP.find(a => a.id === r.aisleId) || AISLE_MAP[0];
            groupedSteps.push({ 
              ...mapData, 
              aisleId: mapData.id, 
              aisleName: mapData.name, 
              items: r.items.map((n: string) => ({ name: n })) 
            });
          }
        });
        
        setRoutePreview({ steps: groupedSteps });
        toast.success('Prévia gerada com sucesso!', { id: 'mgr-route' });
      } else {
        toast.error('Não foi possível gerar a prévia.', { id: 'mgr-route' });
      }
    } catch { toast.error('Erro ao gerar prévia.', { id: 'mgr-route' }); }
    finally { setLoading(false); }
  };

  const handlePublishLayout = async () => {
    if (!selectedStore) { toast.error('Selecione o supermercado.'); return; }
    if (!file && !preview) { toast.error('Faça upload do mapa do mercado.'); return; }
    setLoading(true);
    try {
      if (file) {
        const formData = new FormData();
        formData.append('layout', file);
        await storeAPI.uploadLayout(selectedStore, formData);
      }
      localStorage.setItem('store_layout_published', selectedStore);

      // ✅ Salva a rota (se existir prévia) para os clientes verem na página GPS
      if (routePreview?.steps?.length > 0) {
        localStorage.setItem('gps_route', JSON.stringify(routePreview.steps));
        toast.success('✅ Layout e rota publicados! Os clientes já podem usar a navegação GPS.');
      } else {
        toast.success('✅ Layout publicado! Gere uma prévia de rota para também publicá-la aos clientes.');
      }
    } catch { toast.error('Erro ao publicar. Tente novamente.'); }
    finally { setLoading(false); }
  };

  const handleClearLayout = () => {
    setFile(null);
    setPreview(null);
    setRoutePreview(null);
    localStorage.removeItem('manager_layout_preview');
    localStorage.removeItem('store_layout_published');
    toast.success('Layout removido.');
  };

  // Tela de acesso negado
  if (!isManager) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <FiLock className="w-10 h-10 text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500 max-w-sm">
            Esta área é exclusiva para gerentes e administradores do supermercado.<br />
            Entre em contato com o administrador para obter acesso.
          </p>
        </div>
        <div className="px-6 py-3 rounded-full bg-red-50 border border-red-100 text-red-600 font-semibold text-sm">
          Seu perfil: <strong>{user?.role || 'usuário'}</strong> — sem permissão de gerência
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header da gerência */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
              <FiSettings className="w-3 h-3" /> Painel Gerencial
            </span>
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              {activeUsers} usuários ativos agora
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Configuração do GPS</h1>
          <p className="text-gray-500 mt-1">Configure o mapa do supermercado para os clientes navegarem pelos corredores.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Logado como gerente</p>
            <p className="font-semibold text-gray-700">{user?.name}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-lg">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Painel esquerdo - Configurações */}
        <div className="space-y-5">
          {/* Card Supermercado */}
          <div className="card space-y-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold">1</span>
              Supermercado
            </h2>
            <select
              value={selectedStore}
              onChange={e => setSelectedStore(e.target.value)}
              className="input-field w-full"
            >
              <option value="">Selecione o local...</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
              {stores.length === 0 && <option value="default">Supermercado Central</option>}
            </select>
          </div>

          {/* Card Upload Mapa */}
          <div className="card space-y-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold">2</span>
              Mapa do Mercado
            </h2>
            <div className="border-2 border-dashed border-primary-300 rounded-xl p-4 text-center hover:bg-primary-50/30 transition-colors cursor-pointer">
              <input type="file" id="manager-layout" className="hidden" accept="image/*" onChange={handleFileChange} />
              <label htmlFor="manager-layout" className="cursor-pointer flex flex-col items-center gap-2">
                <FiUploadCloud className="w-8 h-8 text-primary-500" />
                <span className="text-sm font-medium text-gray-700 truncate max-w-full">
                  {file ? file.name : 'Clique para enviar a planta baixa'}
                </span>
                {file && <span className="text-xs text-primary-500">Clique para trocar</span>}
              </label>
            </div>
            {preview && (
              <div className="flex items-center justify-between text-xs text-gray-500 bg-green-50 px-3 py-2 rounded-lg mt-3">
                <span className="flex items-center gap-1 text-green-700 font-medium">
                  <FiCheckCircle className="w-3.5 h-3.5" /> Mapa carregado
                </span>
                <button onClick={handleClearLayout} className="text-red-400 hover:text-red-600 flex items-center gap-1">
                  <FiTrash2 className="w-3 h-3" /> Remover
                </button>
              </div>
            )}
          </div>

          {/* Card Upload Planilha */}
          <div className="card space-y-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold">3</span>
              Planilha de Produtos (Excel)
            </h2>
            <div className="border-2 border-dashed border-primary-300 rounded-xl p-4 text-center hover:bg-primary-50/30 transition-colors cursor-pointer">
              <input type="file" id="manager-spreadsheet" className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleSpreadsheetUpload} />
              <label htmlFor="manager-spreadsheet" className="cursor-pointer flex flex-col items-center gap-2">
                <FiFileText className="w-8 h-8 text-primary-500" />
                <span className="text-sm font-medium text-gray-700 truncate max-w-full px-2">
                  {spreadsheetFile ? spreadsheetFile.name : 'Clique para enviar a planilha de produtos'}
                </span>
                {spreadsheetFile && <span className="text-xs text-primary-500">Clique para trocar</span>}
              </label>
            </div>
            {spreadsheetFile && (
              <div className="flex items-center justify-between text-xs text-gray-500 bg-green-50 px-3 py-2 rounded-lg mt-3">
                <span className="flex items-center gap-1 text-green-700 font-medium">
                  <FiCheckCircle className="w-3.5 h-3.5" /> Planilha carregada ({parsedProducts.length} itens)
                </span>
                <button onClick={handleClearSpreadsheet} className="text-red-400 hover:text-red-600 flex items-center gap-1 font-bold">
                  <FiTrash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="space-y-3">
            <button
              onClick={handlePreviewRoute}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full border-2 border-primary-400 text-primary-700 font-semibold hover:bg-primary-50 transition-all disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Prévia da Rota com IA
            </button>
            <button
              onClick={handlePublishLayout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-all shadow-lg disabled:opacity-50"
            >
              <FiNavigation className="w-4 h-4" />
              {loading ? 'Publicando...' : 'Publicar para Clientes'}
            </button>
          </div>

          {/* Status */}
          <div className="card bg-amber-50 border border-amber-100 space-y-2">
            <h3 className="font-semibold text-amber-800 text-sm">ℹ️ Como funciona</h3>
            <ul className="text-xs text-amber-700 space-y-1.5">
              <li>• Faça upload da planta baixa do supermercado</li>
              <li>• Clique em <strong>Prévia</strong> para testar a rota gerada pela IA</li>
              <li>• Ao <strong>Publicar</strong>, todos os clientes passam a usar este mapa</li>
              <li>• A IA mapeia os produtos de cada cliente ao corredor correto automaticamente</li>
            </ul>
          </div>
        </div>

        {/* Painel direito - Visualização */}
        <div className="lg:col-span-2 space-y-5">
          {/* Prévia do Mapa */}
          <div className="card min-h-[380px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <FiMapPin className="text-primary-500" /> Visualização do Mapa
              </h2>
              {preview && (
                <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                  ✓ Mapa ativo
                </span>
              )}
            </div>

            {preview ? (
              <div className="relative flex-1 min-h-[300px]">
                <img src={preview} alt="Layout do Mercado" className="w-full h-full object-contain rounded-xl" />
                {routePreview && (
                  <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline
                      points={routePreview.steps.map((s: any) => `${s.x},${s.y}`).join(' ')}
                      fill="none" stroke="#1a8917" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7"
                    />
                    {routePreview.steps.map((step: any, i: number) => (
                      <g key={i}>
                        <circle cx={step.x} cy={step.y} r="3.5" fill="rgba(26,137,23,0.2)" />
                        <circle cx={step.x} cy={step.y} r="2.2" fill="#ff6b35" stroke="white" strokeWidth="0.6" />
                        <text x={step.x} y={step.y - 3.8} textAnchor="middle" fontSize="2.8" fill="#1a8917" fontWeight="bold">{i + 1}</text>
                        <text x={step.x} y={step.y + 5.5} textAnchor="middle" fontSize="2" fill="#1a4a1a" fontWeight="600">
                          {(step.name || step.aisleName || '').split(' ')[0]}
                        </text>
                      </g>
                    ))}
                  </svg>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 py-16 gap-3">
                <FiUploadCloud className="w-14 h-14" />
                <p className="text-base font-medium text-gray-400">Nenhum mapa carregado</p>
                <p className="text-sm text-gray-300">Faça upload da planta baixa do supermercado ao lado</p>
              </div>
            )}
          </div>

          {/* Tabela de Corredores */}
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiSettings className="text-primary-500" /> Corredores Configurados
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AISLE_MAP.map((aisle) => (
                <div key={aisle.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xl">{aisle.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">{aisle.name}</p>
                    <p className="text-[10px] text-gray-400">x:{aisle.x} y:{aisle.y}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prévia dos passos da rota */}
          {routePreview && (
            <div className="card">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiCheckCircle className="text-primary-500" /> Prévia da Rota Gerada
                <span className="text-xs text-gray-400 font-normal">(com itens de exemplo)</span>
              </h2>
              <ol className="space-y-2">
                {routePreview.steps.map((step: any, i: number) => (
                  <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="w-7 h-7 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                    <span className="text-xl">{step.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-primary-700 text-sm">{step.aisleName || step.name}</p>
                      <p className="text-xs text-gray-400 truncate">{step.items?.map((it: any) => it.name).join(', ')}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
