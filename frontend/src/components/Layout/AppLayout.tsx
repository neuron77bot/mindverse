import { useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useMindverseStore } from '../../store/mindverseStore';
import Header from './Header';
import NodeEditor from '../Mindverse/NodeEditor';
import { logout } from '../Auth/LoginView';

export default function AppLayout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const initFromBackend = useMindverseStore((s) => s.initFromBackend);
  const syncStatus      = useMindverseStore((s) => s.syncStatus);

  useEffect(() => { initFromBackend(); }, []);

  // Determinar qué vista está activa para el Header
  const activeView: 'home' | 'mapa' = location.pathname.startsWith('/mapa') ? 'mapa' : 'home';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <Header
        activeView={activeView}
        onViewChange={(v) => navigate(v === 'mapa' ? '/mapa' : '/')}
        syncStatus={syncStatus}
        onLogout={handleLogout}
        onProfile={() => navigate('/perfil')}
      />
      <Outlet />
      <NodeEditor />
    </div>
  );
}
