import { useState, useEffect } from 'react';
import { useMindverseStore } from './store/mindverseStore';
import Header from './components/Layout/Header';
import MindverseCanvas from './components/Mindverse/MindverseCanvas';
import NodeEditor from './components/Mindverse/NodeEditor';
import TemporalFilter from './components/Filters/TemporalFilter';
import CategoryFilter from './components/Filters/CategoryFilter';
import LayoutFilter from './components/Filters/LayoutFilter';
import HomeView from './components/Home/HomeView';
import DetailView from './components/Home/DetailView';
import LoginView, { isAuthenticated } from './components/Auth/LoginView';
import ProfileView from './components/Auth/ProfileView';
import type { MindverseNode } from './types';

type View = 'home' | 'detail' | 'mapa' | 'profile';

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [activeView, setActiveView] = useState<View>('home');
  const [detailNode, setDetailNode] = useState<MindverseNode | null>(null);
  const setFocusedNode    = useMindverseStore((s) => s.setFocusedNode);
  const initFromBackend   = useMindverseStore((s) => s.initFromBackend);
  const syncStatus        = useMindverseStore((s) => s.syncStatus);

  // Sincronizar con el backend al autenticarse
  useEffect(() => {
    if (authenticated) initFromBackend();
  }, [authenticated]);

  const navigateToDetail = (node: MindverseNode) => {
    setDetailNode(node);
    setActiveView('detail');
  };

  const navigateToHome = () => {
    setDetailNode(null);
    setActiveView('home');
  };

  // Navegar al mapa — con o sin foco en un nodo
  const navigateToMap = (nodeId?: string) => {
    setFocusedNode(nodeId ?? null);
    setDetailNode(null);
    setActiveView('mapa');
  };

  const headerView = (activeView === 'detail' || activeView === 'profile') ? 'home' : activeView as 'home' | 'mapa';

  const handleViewChange = (view: 'home' | 'mapa') => {
    if (view === 'mapa') {
      navigateToMap(); // sin foco → mapa completo
    } else {
      setDetailNode(null);
      setActiveView(view);
    }
  };

  if (!authenticated) {
    return <LoginView onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <Header
        activeView={headerView}
        onViewChange={handleViewChange}
        syncStatus={syncStatus}
        onLogout={() => setAuthenticated(false)}
        onProfile={() => setActiveView('profile')}
      />

      {/* PROFILE */}
      {activeView === 'profile' && (
        <ProfileView onBack={() => setActiveView('home')} />
      )}

      {/* HOME */}
      {activeView === 'home' && (
        <HomeView
          onNavigateToMap={navigateToMap}
          onNavigateToDetail={navigateToDetail}
        />
      )}

      {/* DETAIL */}
      {activeView === 'detail' && detailNode && (
        <DetailView
          node={detailNode}
          onBack={navigateToHome}
          onNavigateToMap={navigateToMap}
        />
      )}

      {/* MAPA */}
      {activeView === 'mapa' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-2 sm:px-6 sm:py-4 flex flex-col gap-2 bg-slate-900">
            {/* Banner de foco activo */}
            {useMindverseStore.getState().focusedNodeId && (
              <div className="flex items-center justify-between px-3 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-sm">
                <span className="text-indigo-300">🔍 Vista enfocada</span>
                <button
                  onClick={() => navigateToMap()}
                  className="text-indigo-400 hover:text-white transition-colors font-medium"
                >
                  Ver mapa completo →
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
              <TemporalFilter />
              <CategoryFilter />
            </div>
            <LayoutFilter />
          </div>
          <div className="flex-1 mx-2 mb-2 sm:mx-6 sm:mb-6 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            <MindverseCanvas />
          </div>
        </div>
      )}

      <NodeEditor />
    </div>
  );
}

export default App;
