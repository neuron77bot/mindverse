import { useMindverseStore } from '../../store/mindverseStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../data/mockData';
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

interface DetailViewProps {
  node: MindverseNode;
  onBack: () => void;
  onNavigateToMap: (nodeId?: string) => void;
}

export default function DetailView({ node, onBack, onNavigateToMap }: DetailViewProps) {
  const { nodes, connections, openEditor } = useMindverseStore();
  const color = CATEGORY_COLORS[node.category] || '#6366F1';

  // Pasos directamente conectados al nodo principal
  const stepIds = connections
    .filter((c) => c.source === node.id)
    .map((c) => c.target);
  const steps = nodes.filter((n) => stepIds.includes(n.id));

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">

      {/* Barra superior con back */}
      <div className="px-3 py-3 sm:px-6 sm:py-4 flex items-center gap-3 border-b border-slate-700 bg-slate-800/50 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          ← Volver
        </button>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300 text-sm truncate">{node.content}</span>
      </div>

      <div className="px-3 py-5 sm:px-6 sm:py-8 flex-1">

        {/* Hero del pensamiento */}
        <div
          className="rounded-2xl p-5 sm:p-7 mb-8 border"
          style={{
            backgroundColor: `${color}10`,
            borderColor: `${color}30`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              {CATEGORY_ICONS[node.category]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${color}25`, color }}
                >
                  {CATEGORY_LABELS[node.category]}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  {TEMPORAL_ICONS[node.temporalState]}
                  {TEMPORAL_LABELS_MAP[node.temporalState]}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
                {node.content}
              </h2>
              {node.description && (
                <p className="text-slate-400 leading-relaxed">{node.description}</p>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t" style={{ borderColor: `${color}20` }}>
            <button
              onClick={() => openEditor(node)}
              className="text-sm px-4 py-2 rounded-lg font-medium transition-all"
              style={{ backgroundColor: `${color}20`, color }}
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => onNavigateToMap(node.id)}
              className="text-sm px-4 py-2 rounded-lg font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
            >
              🗺️ Ver en mapa
            </button>
          </div>
        </div>

        {/* Pasos / Subtareas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-lg">
              Pasos <span className="text-slate-500 font-normal text-base">({steps.length})</span>
            </h3>
            <button
              onClick={() => openEditor()}
              className="text-sm px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg font-medium transition-all"
            >
              + Agregar paso
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">
              <p className="text-slate-500 text-sm mb-3">No hay pasos definidos todavía</p>
              <button
                onClick={() => openEditor()}
                className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all"
              >
                + Agregar primer paso
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, idx) => {
                const stepColor = CATEGORY_COLORS[step.category] || '#6366F1';
                return (
                  <div
                    key={step.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer group"
                    onClick={() => openEditor(step)}
                  >
                    {/* Número */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: `${stepColor}25`, color: stepColor }}
                    >
                      {idx + 1}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold leading-tight mb-1">{step.content}</p>
                      {step.description && (
                        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                          {step.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${stepColor}20`, color: stepColor }}
                        >
                          {CATEGORY_LABELS[step.category]}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {TEMPORAL_ICONS[step.temporalState]} {TEMPORAL_LABELS_MAP[step.temporalState]}
                        </span>
                      </div>
                    </div>

                    {/* Editar hint */}
                    <span className="text-slate-600 group-hover:text-slate-400 text-sm transition-colors shrink-0 mt-1">
                      ✏️
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
