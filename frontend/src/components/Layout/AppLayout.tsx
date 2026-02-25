import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useMindverseStore } from '../../store/mindverseStore';
import Sidebar from './Sidebar';
import NodeEditor from '../Mindverse/NodeEditor';
import { logout } from '../Auth/LoginView';

export default function AppLayout() {
  const navigate = useNavigate();
  const initFromBackend = useMindverseStore((s) => s.initFromBackend);

  useEffect(() => { initFromBackend(); }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="h-screen flex bg-slate-900">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
      <NodeEditor />
    </div>
  );
}
