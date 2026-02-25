import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './router/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import MapaPage from './pages/MapaPage';
import DetailPage from './pages/DetailPage';
import ProfilePage from './pages/ProfilePage';
import StoryboardCreatePage from './pages/StoryboardCreatePage';
import StoryboardDetailPage from './pages/StoryboardDetailPage';
import StoryboardsPage from './pages/StoryboardsPage';

export default function App() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protegidas — envueltas en AppLayout (Header + NodeEditor) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/mapa" element={<MapaPage />} />
          <Route path="/detail/:id" element={<DetailPage />} />
          <Route path="/storyboard/create" element={<StoryboardCreatePage />} />
          <Route path="/storyboard/detail/:id" element={<StoryboardDetailPage />} />
          <Route path="/storyboard/edit/:id" element={<StoryboardDetailPage />} />
          <Route path="/storyboards" element={<StoryboardsPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
