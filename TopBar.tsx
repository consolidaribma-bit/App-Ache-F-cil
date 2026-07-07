import { FiMenu, FiLogOut } from 'react-icons/fi';
import { useAuthStore } from '../utils/store';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const isManager = user?.role === 'admin' || user?.role === 'root' || user?.email === 'edukadoshmda@gmail.com';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/85 backdrop-blur-lg border border-white/60 rounded-[2rem] shadow-sm h-20 px-4 sm:px-8 flex items-center justify-between shrink-0 z-40">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl">
          <FiMenu className="w-6 h-6" />
        </button>
        <button onClick={() => navigate('/app')} className="hidden md:block transition-transform hover:scale-[1.02] ml-2">
          <img src="/logo.png" alt="Ache Fácil" className="h-[75px] w-auto drop-shadow-md scale-[1.2] origin-left" />
        </button>
        <span className="md:hidden font-bold text-xl text-primary-600">Ache Fácil</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-3 px-2 sm:px-4 py-2 rounded-2xl bg-gray-50 border border-gray-100 shadow-inner">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-lg shrink-0 shadow-sm border border-primary-200">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 hidden md:block text-right">
            <p className="text-sm font-bold text-gray-800 truncate">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
          </div>
          {isManager && (
            <span className="shrink-0 px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase ml-2 hidden sm:block border border-amber-200">
              ADM
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          title="Sair"
          className="w-12 h-12 flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all shadow-sm border border-transparent hover:border-red-100"
        >
          <FiLogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
