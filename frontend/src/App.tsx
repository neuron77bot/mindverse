import Header from './components/Layout/Header';
import MindverseCanvas from './components/Mindverse/MindverseCanvas';
import NodeEditor from './components/Mindverse/NodeEditor';
import TemporalFilter from './components/Filters/TemporalFilter';
import CategoryFilter from './components/Filters/CategoryFilter';
import LayoutFilter from './components/Filters/LayoutFilter';

function App() {
  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filters Bar */}
        <div className="px-3 py-2 sm:px-6 sm:py-4 flex flex-col gap-2 bg-slate-900">
          {/* Fila superior: temporal + categorías */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
            <TemporalFilter />
            <CategoryFilter />
          </div>
          {/* Fila inferior: layout */}
          <LayoutFilter />
        </div>

        {/* Mind Map Canvas */}
        <div className="flex-1 mx-2 mb-2 sm:mx-6 sm:mb-6 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
          <MindverseCanvas />
        </div>
      </div>

      {/* Node Editor Modal */}
      <NodeEditor />
    </div>
  );
}

export default App;
