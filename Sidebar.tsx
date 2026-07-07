import { NavLink } from 'react-router-dom';
import { FiHome, FiTag, FiBell, FiX, FiSettings, FiShield } from 'react-icons/fi';
import { useAuthStore } from '../utils/store';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user);

  const isManager = user?.role === 'admin' || user?.role === 'root' || user?.email === 'edukadoshmda@gmail.com';

  const userMenuItems = [
    { icon: FiHome, label: 'Início', path: '/app' },
    { icon: FiTag, label: 'Cardápios', path: '/app/menus' },
    { icon: FiBell, label: 'Ofertas', path: '/app/offers' },
  ];

  const managerMenuItems = [
    { icon: FiSettings, label: 'Painel Gerente', path: '/app/manager' },
  ];

  const rootMenuItems = [
    { icon: FiShield, label: 'Painel Root', path: '/app/root' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-2 left-2 z-50 w-64 bg-white/85 backdrop-blur-lg border border-white/60 rounded-[2rem] shadow-xl md:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col overflow-hidden shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header (Close Button) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/30 shrink-0">
          <span className="font-bold text-primary-600">Menu</span>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* Menu do usuário */}
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-2">Menu</p>
          {userMenuItems.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/app'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-full font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </NavLink>
          ))}

          {/* Menu de Gerência (só para admin/root) */}
          {isManager && (
            <>
              <div className="pt-3">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-4 py-2 flex items-center gap-1.5">
                  <FiSettings className="w-3 h-3" /> Gerência
                </p>
              </div>
              {managerMenuItems.map(({ icon: Icon, label, path }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-full font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </>
          )}

          {/* Menu Root (só para root) */}
          {(user?.role === 'root' || user?.email === 'edukadoshmda@gmail.com') && (
            <>
              <div className="pt-3">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-4 py-2 flex items-center gap-1.5">
                  <FiShield className="w-3 h-3" /> Root
                </p>
              </div>
              {rootMenuItems.map(({ icon: Icon, label, path }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-full font-medium transition-colors ${
                      isActive
                        ? 'bg-red-50 text-red-700'
                        : 'text-gray-600 hover:bg-red-50 hover:text-red-700'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
