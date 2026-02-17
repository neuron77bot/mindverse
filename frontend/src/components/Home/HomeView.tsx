import { useMindverseStore } from '../../store/mindverseStore';
import { CATEGORY_COLORS, CATEGORY_LABELS, ROOT_NODE_ID } from '../../data/mockData';

const TEMPORAL_ICONS: Record<string, string> = {
  PAST: '⏮️',
  PRESENT: '⏺️',
  FUTURE: '⏭️',
};

const TEMPORAL_LABELS_MAP: Record<string, string> = {
  PAST: 'Pasado',
  PRESENT: 'Presente',
  FUTURE: 'Futuro',
};

interface HomeViewProps {
  onNavigateToMap: () => void;
}

export default function HomeView({ onNavigateToMap }: HomeViewProps) {
  const { nodes, connections, openEditor } = useMindverseStore();

  // Nodos directamente conectados al root
  const rootConnectionTargets = connections
    .filter((c) => c.source === ROOT_NODE_ID)
    .map((c) => c.target);

  const mainNodes = nodes.filter((n) => rootConnectionTargets.includes(n.id));

  // Contar hijos de cada nodo principal
  const childCount = (nodeId: string) =>
    connections.filter((c) => c.source === nodeId).length;

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
      {/* Bienvenida */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Mis Proyectos</h2>
        <p className="text-slate-400 text-sm">
          {mainNodes.length} tópicos conectados al Casco Periférico
        </p>
      </div>

      {/* Grid de cards */}
      {mainNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-5xl mb-4">🧠</div>
          <p className="text-slate-400 text-lg mb-2">No hay tópicos todavía</p>
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
            const children = childCount(node.id);

            return (
              <div
                key={node.id}
                onClick={onNavigateToMap}
                className="group bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden cursor-pointer transition-all duration-200 hover:border-slate-500 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Barra de color superior */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: color }}
                />

                <div className="p-5">
                  {/* Header de la card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                      style={{ backgroundColor: `${color}25` }}
                    >
                      {node.category === 'HEALTH' && '💪'}
                      {node.category === 'FINANCES' && '💰'}
                      {node.category === 'WORK' && '💼'}
                      {node.category === 'LOVE' && '❤️'}
                      {node.category === 'FAMILY' && '👨‍👩‍👧'}
                      {node.category === 'PERSONAL_GROWTH' && '🚀'}
                      {node.category === 'LEISURE' && '🎉'}
                      {node.category === 'SPIRITUALITY' && '🔮'}
                      {node.category === 'SOCIAL' && '🤝'}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {/* Temporalidad */}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        {TEMPORAL_ICONS[node.temporalState]}
                        {TEMPORAL_LABELS_MAP[node.temporalState]}
                      </span>
                      {/* Categoría */}
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {CATEGORY_LABELS[node.category]}
                      </span>
                    </div>
                  </div>

                  {/* Título */}
                  <h3 className="text-white font-bold text-base mb-1 leading-tight">
                    {node.content}
                  </h3>

                  {/* Descripción */}
                  {node.description && (
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">
                      {node.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                    <span className="text-xs text-slate-500">
                      {children} {children === 1 ? 'paso' : 'pasos'}
                    </span>
                    <span
                      className="text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color }}
                    >
                      Ver en mapa →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Card para agregar nuevo */}
          <div
            onClick={() => openEditor()}
            className="bg-slate-800/50 rounded-2xl border border-dashed border-slate-600 p-5 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800 transition-all duration-200 min-h-[160px]"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-2xl mb-3">
              +
            </div>
            <p className="text-slate-400 text-sm font-medium">Nuevo tópico</p>
          </div>
        </div>
      )}
    </div>
  );
}
