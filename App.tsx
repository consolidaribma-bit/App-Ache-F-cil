import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './utils/store';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import MenuPage from './pages/MenuPage';
import OffersPage from './pages/OffersPage';
import ManagerPage from './pages/ManagerPage';
import RootPanelPage from './pages/RootPanelPage';
import AppLayout from './components/AppLayout';
import './styles/globals.css';

function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(token);
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }

    // Pedir permissão de notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [setUser, setToken]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        
        {/* Protected Routes */}
        {user ? (
          <>
            <Route
              path="/app"
              element={
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/menus"
              element={
                <AppLayout>
                  <MenuPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/offers"
              element={
                <AppLayout>
                  <OffersPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/manager"
              element={
                <AppLayout>
                  <ManagerPage />
                </AppLayout>
              }
            />
            <Route
              path="/app/root"
              element={
                <AppLayout>
                  <RootPanelPage />
                </AppLayout>
              }
            />
          </>
        ) : (
          <Route path="/app/*" element={<Navigate to="/login" />} />
        )}
        
        <Route path="/" element={<Navigate to={user ? '/app' : '/login'} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="top-center" />
    </BrowserRouter>
  );
}

export default App;
