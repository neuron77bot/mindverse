import { useMindverseStore } from '../../store/mindverseStore';
import { CATEGORY_COLORS, CATEGORY_LABELS, ROOT_NODE_ID } from '../../data/mockData';
import type { MindverseNode } from '../../types';

const TEMPORAL_ICONS: Record<string, string> = {
  PAST: '⏮️', PRESENT: '⏺️', FUTURE: '⏭️',
};
const TEMPORAL_LABELS_MAP: Record<string, string> = {
  PAST: 'Pasado', PRESENT: 'Presente', FUTURE: 'Futuro',
};
const CATEGORY_ICONS: Record<string, string> = {
  HEALTH: '💪', FINANCES: '💰', WORK: '💼', LOVE: '❤️',
  FAMILY: '👨‍👩‍👧', PERSONAL_GROWTH: '🚀', LEISURE: '🎉',
  SPIRITUALITY: '🔮', SOCIAL: '🤝',
};

interface HomeViewProps {
  onNavigateToMap: () => void;
  onNavigateToDetail: (node: MindverseNode) => void;
}

export default function HomeView({ onNavigateToMap, onNavigateToDetail }: HomeViewProps) {
  const { nodes, connections, openEditor } = useMindverseStore();

  const rootConnectionTargets = connections
    .filter((c) => c.source === ROOT_NODE_ID)
    .map((c) => c.target);

  const mainNodes = nodes.filter((n) => rootConnectionTargets.includes(n.id));

  const getStepCount = (nodeId: string) =>
    connections.filter((c) => c.source === nodeId).length;

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Mis pensamientos</h2>
        <p className="text-slate-400 text-sm">
          {mainNodes.length} tópicos conectados al Casco Periférico
        </p>
      </div>

      {/* Botón nuevo pensamiento — arriba del grid */}
      <div className="mb-4">
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-medium text-sm shadow-lg shadow-indigo-500/25"
        >
          <span className="text-lg leading-none">+</span> Nuevo pensamiento
        </button>
      </div>

      {mainNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-5xl mb-4">🧠</div>
          <p className="text-slate-400 text-lg mb-2">No hay pensamientos todavía</p>
          <p className="text-slate-500 text-sm mb-6">
            Creá un nuevo pensamiento y conectalo al Casco Periférico
          </p>
          <button
            onClick={() => openEditor()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-medium"
          >
            + Nuevo Pensamiento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mainNodes.map((node) => {
            const color = CATEGORY_COLORS[node.category] || '#6366F1';
            const stepCount = getStepCount(node.id);

            return (
              <div
                key={node.id}
                className="group bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden transition-all duration-200 hover:border-slate-500 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                      style={{ backgroundColor: `${color}25` }}
                    >
                      {CATEGORY_ICONS[node.category]}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        {TEMPORAL_ICONS[node.temporalState]}
                        {TEMPORAL_LABELS_MAP[node.temporalState]}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {CATEGORY_LABELS[node.category]}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-white font-bold text-base mb-1 leading-tight">
                    {node.content}
                  </h3>

                  {node.description && (
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">
                      {node.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-700 gap-2">
                    {/* Ver detalle */}
                    <button
                      onClick={() => onNavigateToDetail(node)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      📋 {stepCount} {stepCount === 1 ? 'paso' : 'pasos'}
                    </button>

                    {/* Ver en mapa */}
                    <button
                      onClick={onNavigateToMap}
                      className="text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
                    >
                      Ver en mapa →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Nueva card */}
          <div
            onClick={() => openEditor()}
            className="bg-slate-800/50 rounded-2xl border border-dashed border-slate-600 p-5 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800 transition-all duration-200 min-h-[160px]"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-2xl mb-3">
              +
            </div>
            <p className="text-slate-400 text-sm font-medium">Nuevo pensamiento</p>
          </div>
        </div>
      )}
    </div>
  );
}
