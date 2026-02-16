import Header from './components/Layout/Header';
import MindverseCanvas from './components/Mindverse/MindverseCanvas';
import NodeEditor from './components/Mindverse/NodeEditor';
import TemporalFilter from './components/Filters/TemporalFilter';
import CategoryFilter from './components/Filters/CategoryFilter';

function App() {
  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filters Bar */}
        <div className="px-6 py-4 flex items-start justify-between gap-4 bg-slate-900">
          <TemporalFilter />
          <CategoryFilter />
        </div>

        {/* Mind Map Canvas */}
        <div className="flex-1 mx-6 mb-6 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
          <MindverseCanvas />
        </div>
      </div>

      {/* Node Editor Modal */}
      <NodeEditor />
    </div>
  );
}

export default App;
