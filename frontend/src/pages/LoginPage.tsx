import { useNavigate, Navigate } from 'react-router-dom';
import LoginView from '../components/Auth/LoginView';
import { isAuthenticated } from '../services/auth';

export default function LoginPage() {
  const navigate = useNavigate();

  if (isAuthenticated()) return <Navigate to="/" replace />;

  return <LoginView onSuccess={() => navigate('/', { replace: true })} />;
}
