import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useMindverseStore } from '../../store/mindverseStore';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import NodeEditor from '../Mindverse/NodeEditor';
import { logout } from '../../services/auth';

export default function AppLayout() {
  const navigate = useNavigate();
  const initFromBackend = useMindverseStore((s) => s.initFromBackend);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    initFromBackend();
  }, [initFromBackend]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-slate-900">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      {/* Mobile Header - Solo visible en mobile */}
      <MobileHeader
        onMenuClick={() => setIsSidebarOpen(true)}
        onLogout={handleLogout}
        onProfile={() => navigate('/perfil')}
      />

      {/* Sidebar */}
      <Sidebar
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 overflow-y-auto" role="main">
        <Outlet />
      </main>

      {/* Node Editor (overlay) */}
      <NodeEditor />
    </div>
  );
}
