import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import ProtectedRoute from './router/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import PageLoader from './components/UI/PageLoader';

// Lazy load pages for better code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const MapaPage = lazy(() => import('./pages/MapaPage'));
const DetailPage = lazy(() => import('./pages/DetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const StoryboardCreatePage = lazy(() => import('./pages/StoryboardCreatePage'));
const StoryboardEditPage = lazy(() => import('./pages/StoryboardEditPage'));
const StoryboardDetailPage = lazy(() => import('./pages/StoryboardDetailPage'));
const StoryboardListPage = lazy(() => import('./pages/StoryboardListPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));

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
      <Suspense fallback={<PageLoader />}>
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
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
