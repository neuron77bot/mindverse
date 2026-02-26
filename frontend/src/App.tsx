import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import ProtectedRoute from './router/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import MapaPage from './pages/MapaPage';
import DetailPage from './pages/DetailPage';
import ProfilePage from './pages/ProfilePage';
import StoryboardCreatePage from './pages/StoryboardCreatePage';
import StoryboardEditPage from './pages/StoryboardEditPage';
import StoryboardDetailPage from './pages/StoryboardDetailPage';
import StoryboardListPage from './pages/StoryboardListPage';

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        theme="dark"
        toastOptions={{
          style: {
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#f1f5f9',
          },
        }}
      />
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
            <Route path="/storyboard/edit/:id" element={<StoryboardEditPage />} />
            <Route path="/storyboards" element={<StoryboardListPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
