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
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Node Editor (overlay) */}
      <NodeEditor />
    </div>
  );
}
