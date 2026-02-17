import { useState } from 'react';
import Header from './components/Layout/Header';
import MindverseCanvas from './components/Mindverse/MindverseCanvas';
import NodeEditor from './components/Mindverse/NodeEditor';
import TemporalFilter from './components/Filters/TemporalFilter';
import CategoryFilter from './components/Filters/CategoryFilter';
import LayoutFilter from './components/Filters/LayoutFilter';
import HomeView from './components/Home/HomeView';
import DetailView from './components/Home/DetailView';
import type { MindverseNode } from './types';

type View = 'home' | 'detail' | 'mapa';

function App() {
  const [activeView, setActiveView] = useState<View>('home');
  const [detailNode, setDetailNode] = useState<MindverseNode | null>(null);

  const navigateToDetail = (node: MindverseNode) => {
    setDetailNode(node);
    setActiveView('detail');
  };

  const navigateToHome = () => {
    setDetailNode(null);
    setActiveView('home');
  };

  // Para el Header: "detail" se trata como "home" visualmente en la nav
  const headerView = activeView === 'detail' ? 'home' : activeView;

  const handleViewChange = (view: 'home' | 'mapa') => {
    setDetailNode(null);
    setActiveView(view);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <Header activeView={headerView} onViewChange={handleViewChange} />

      {/* HOME */}
      {activeView === 'home' && (
        <HomeView
          onNavigateToMap={() => handleViewChange('mapa')}
          onNavigateToDetail={navigateToDetail}
        />
      )}

      {/* DETAIL */}
      {activeView === 'detail' && detailNode && (
        <DetailView
          node={detailNode}
          onBack={navigateToHome}
          onNavigateToMap={() => handleViewChange('mapa')}
        />
      )}

      {/* MAPA */}
      {activeView === 'mapa' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-2 sm:px-6 sm:py-4 flex flex-col gap-2 bg-slate-900">
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
