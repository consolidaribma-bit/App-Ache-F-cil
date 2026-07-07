import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Aplicar tema com cores da logo
    document.documentElement.style.setProperty('--color-primary', '#1a8917');
    document.documentElement.style.setProperty('--color-accent', '#ff6b35');
  }, []);

  return (
    <div className="h-screen bg-stripes flex flex-col p-2 sm:p-4 gap-2 sm:gap-4 overflow-hidden">
      {/* TopBar */}
      <TopBar onMenuClick={() => setIsSidebarOpen(true)} />

      <div className="flex-1 flex min-h-0 gap-2 sm:gap-4 relative">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 bg-transparent rounded-[2rem] overflow-hidden relative flex flex-col min-w-0">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
