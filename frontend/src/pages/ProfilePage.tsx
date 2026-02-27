import { useNavigate } from 'react-router-dom';
import ProfileView from '../components/Auth/ProfileView';
import Breadcrumb from '../components/UI/Breadcrumb';

export default function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
      <Breadcrumb items={[{ label: 'Mi perfil' }]} onBack={() => navigate(-1)} />
      <ProfileView />
    </div>
  );
}
