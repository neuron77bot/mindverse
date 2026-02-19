import { useNavigate } from 'react-router-dom';
import { useMindverseStore } from '../store/mindverseStore';
import MindverseCanvas from '../components/Mindverse/MindverseCanvas';
import TemporalFilter from '../components/Filters/TemporalFilter';
import CategoryFilter from '../components/Filters/CategoryFilter';
import LayoutFilter from '../components/Filters/LayoutFilter';

export default function MapaPage() {
  const navigate       = useNavigate();
  const focusedNodeId  = useMindverseStore((s) => s.focusedNodeId);
  const setFocusedNode = useMindverseStore((s) => s.setFocusedNode);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-3 py-2 sm:px-6 sm:py-4 flex flex-col gap-2 bg-slate-900">
        {focusedNodeId && (
          <div className="flex items-center justify-between px-3 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-sm">
            <span className="text-indigo-300">🔍 Vista enfocada</span>
            <button
              onClick={() => { setFocusedNode(null); navigate('/mapa'); }}
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
  );
}
