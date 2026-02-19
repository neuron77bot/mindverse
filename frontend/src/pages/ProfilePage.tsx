import { useNavigate } from 'react-router-dom';
import ProfileView from '../components/Auth/ProfileView';

export default function ProfilePage() {
  const navigate = useNavigate();
  return <ProfileView onBack={() => navigate(-1)} />;
}
