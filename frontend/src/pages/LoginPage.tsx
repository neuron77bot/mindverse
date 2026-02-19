import { useNavigate } from 'react-router-dom';
import LoginView, { isAuthenticated } from '../components/Auth/LoginView';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  if (isAuthenticated()) return <Navigate to="/" replace />;

  return <LoginView onSuccess={() => navigate('/', { replace: true })} />;
}
