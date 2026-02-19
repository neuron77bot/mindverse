import { useMindverseStore } from '../../store/mindverseStore';
import { CATEGORY_COLORS, CATEGORY_LABELS, EMOTIONAL_COLORS, HAWKINS_SCALE } from '../../data/mockData';
import type { MindverseNode } from '../../types';
import ExpandableText from '../UI/ExpandableText';
import { getFreqLabel } from '../../utils/vibration';

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

function NodeLabels({ node, size = 'md' }: { node: MindverseNode; size?: 'sm' | 'md' }) {
  const color    = CATEGORY_COLORS[node.category] || '#6366F1';
  const vibColor = EMOTIONAL_COLORS[node.emotionalLevel] || color;
  const hawkins  = HAWKINS_SCALE.find((l) => l.key === node.emotionalLevel);
  const freq     = hawkins ? getFreqLabel(hawkins.calibration) : null;
  const cls      = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {hawkins && (
        <span
          className={`inline-flex items-center gap-1 rounded-full border font-semibold ${cls}`}
          style={{ borderColor: `${vibColor}50`, color: vibColor, backgroundColor: `${vibColor}15` }}
        >
          {hawkins.label} · {hawkins.calibration}
        </span>
      )}
      {freq && (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-semibold ${cls}`}
          style={{ color: freq.color, backgroundColor: freq.bg }}
        >
          {freq.icon} {freq.label}
        </span>
      )}
      <span
        className={`inline-flex items-center gap-1 rounded-full font-semibold ${cls}`}
        style={{ backgroundColor: `${color}20`, color }}
      >
        {CATEGORY_ICONS[node.category]} {CATEGORY_LABELS[node.category]}
      </span>
      <span className={`inline-flex items-center gap-0.5 rounded-full bg-slate-700/60 text-slate-300 font-medium ${cls}`}>
        {TEMPORAL_ICONS[node.temporalState]} {TEMPORAL_LABELS_MAP[node.temporalState]}
      </span>
    </div>
  );
}

export default function DetailView({ node, onBack, onNavigateToMap }: DetailViewProps) {
  const { nodes, connections, openEditor } = useMindverseStore();

  const color    = CATEGORY_COLORS[node.category] || '#6366F1';
  const vibColor = EMOTIONAL_COLORS[node.emotionalLevel] || color;

  // Recorre la cadena secuencial desde el nodo (paso a paso)
  const steps: MindverseNode[] = [];
  const visited = new Set<string>([node.id]);
  let currentId: string | undefined = connections.find((c) => c.source === node.id)?.target;
  while (currentId) {
    const step = nodes.find((n) => n.id === currentId);
    if (!step || visited.has(currentId)) break;
    visited.add(currentId);
    steps.push(step);
    currentId = connections.find(
      (c) => c.source === currentId && !visited.has(c.target)
    )?.target;
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">

      {/* Barra superior */}
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
          className="rounded-2xl mb-8 border overflow-hidden"
          style={{ backgroundColor: `${vibColor}15`, borderColor: `${vibColor}40` }}
        >
          {/* Imagen hero */}
          {node.imageUrl && (
            <div className="relative h-52 sm:h-72 w-full overflow-hidden">
              <img
                src={node.imageUrl}
                alt={node.content}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </div>
          )}

          <div className="p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ backgroundColor: `${vibColor}25` }}
              >
                {CATEGORY_ICONS[node.category]}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
                  {node.content}
                </h2>
                <NodeLabels node={node} size="md" />
                {node.description && (
                  <div className="mt-3">
                    <ExpandableText
                      text={node.description}
                      className="text-slate-400 leading-relaxed"
                      clamp={3}
                    />
                  </div>
                )}
              </div>
            </div>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t" style={{ borderColor: `${vibColor}25` }}>
            <button
              onClick={() => openEditor(node)}
              className="text-sm px-4 py-2 rounded-lg font-medium transition-all"
              style={{ backgroundColor: `${vibColor}20`, color: vibColor }}
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
          </div>{/* /p-5 */}
        </div>

        {/* Pasos */}
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
                const stepVibColor = EMOTIONAL_COLORS[step.emotionalLevel] || CATEGORY_COLORS[step.category] || '#6366F1';
                return (
                  <div
                    key={step.id}
                    className="flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group"
                    style={{
                      backgroundColor: `${stepVibColor}10`,
                      borderColor: `${stepVibColor}35`,
                    }}
                    onClick={() => openEditor(step)}
                  >
                    {/* Número */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: `${stepVibColor}25`, color: stepVibColor }}
                    >
                      {idx + 1}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold leading-tight mb-2">{step.content}</p>
                      <NodeLabels node={step} size="sm" />
                      {step.description && (
                        <div className="mt-2">
                          <ExpandableText
                            text={step.description}
                            className="text-slate-400 text-sm leading-relaxed"
                            clamp={2}
                          />
                        </div>
                      )}
                    </div>

                    {/* Thumbnail del paso */}
                    {step.imageUrl && (
                      <img
                        src={step.imageUrl}
                        alt={step.content}
                        className="w-16 h-16 rounded-xl object-cover border shrink-0"
                        style={{ borderColor: `${stepVibColor}40` }}
                      />
                    )}

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
