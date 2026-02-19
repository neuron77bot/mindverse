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
        <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${cls}`}
          style={{ color: freq.color, backgroundColor: freq.bg }}
        >
          {freq.icon} {freq.label}
        </span>
      )}
      <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${cls}`}
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

  const steps: MindverseNode[] = [];
  const visited = new Set<string>([node.id]);
  let currentId: string | undefined = connections.find((c) => c.source === node.id)?.target;
  while (currentId) {
    const step = nodes.find((n) => n.id === currentId);
    if (!step || visited.has(currentId)) break;
    visited.add(currentId);
    steps.push(step);
    currentId = connections.find((c) => c.source === currentId && !visited.has(c.target))?.target;
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col min-h-0">

      {/* Breadcrumb */}
      <div className="px-4 py-3 lg:px-8 flex items-center gap-3 border-b border-slate-700/60 bg-slate-800/40 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <span className="text-slate-700">/</span>
        <span className="text-slate-400 text-sm truncate max-w-xs">{node.content}</span>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden">
        <div className="lg:h-full lg:grid lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]">

          {/* ── Columna izquierda — Hero (sticky en desktop) ─────────────────── */}
          <div
            className="lg:overflow-y-auto lg:border-r"
            style={{ borderColor: `${vibColor}20` }}
          >
            {/* Imagen hero */}
            <div className="relative h-56 sm:h-64 lg:h-72 w-full overflow-hidden shrink-0">
              {node.imageUrl ? (
                <img src={node.imageUrl} alt={node.content} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${vibColor}30 0%, ${vibColor}10 100%)` }}
                >
                  <span className="text-sm font-semibold tracking-widest uppercase opacity-25 text-white">
                    Sin imagen
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
            </div>

            {/* Info del pensamiento */}
            <div className="p-5 lg:p-6 space-y-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
                  {node.content}
                </h1>
                <NodeLabels node={node} size="md" />
              </div>

              {node.description && (
                <div
                  className="rounded-xl p-4 border"
                  style={{ backgroundColor: `${vibColor}08`, borderColor: `${vibColor}20` }}
                >
                  <ExpandableText
                    text={node.description}
                    className="text-slate-300 leading-relaxed text-sm"
                    clamp={4}
                  />
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => openEditor(node)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: `${vibColor}25`, color: vibColor }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => onNavigateToMap(node.id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                >
                  🗺️ Mapa
                </button>
              </div>
            </div>
          </div>

          {/* ── Columna derecha — Pasos ───────────────────────────────────────── */}
          <div className="lg:overflow-y-auto p-4 lg:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                Pasos
                <span
                  className="text-sm font-medium px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${vibColor}20`, color: vibColor }}
                >
                  {steps.length}
                </span>
              </h2>
              <button
                onClick={() => openEditor()}
                className="text-sm px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg font-medium transition-all flex items-center gap-1.5"
              >
                + Agregar paso
              </button>
            </div>

            {steps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl mb-4">
                  🧩
                </div>
                <p className="text-slate-400 font-medium mb-1">Sin pasos definidos</p>
                <p className="text-slate-600 text-sm mb-5">Agregá el primer paso para este pensamiento</p>
                <button
                  onClick={() => openEditor()}
                  className="text-sm px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-medium"
                >
                  + Agregar primer paso
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {steps.map((step, idx) => {
                  const stepVibColor = EMOTIONAL_COLORS[step.emotionalLevel] || CATEGORY_COLORS[step.category] || '#6366F1';
                  return (
                    <div
                      key={step.id}
                      className="rounded-xl border overflow-hidden transition-all cursor-pointer group hover:shadow-lg hover:-translate-y-0.5 duration-200"
                      style={{ backgroundColor: `${stepVibColor}0d`, borderColor: `${stepVibColor}30` }}
                      onClick={() => openEditor(step)}
                    >
                      {/* Banner imagen/placeholder */}
                      <div className="relative h-32 w-full overflow-hidden">
                        {step.imageUrl ? (
                          <img src={step.imageUrl} alt={step.content} className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${stepVibColor}25 0%, ${stepVibColor}10 100%)` }}
                          >
                            <span className="text-[10px] font-semibold tracking-widest uppercase opacity-25 text-white">
                              Sin imagen
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                        {/* Número badge */}
                        <div
                          className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
                          style={{ backgroundColor: stepVibColor }}
                        >
                          {idx + 1}
                        </div>
                        {/* Edit hint */}
                        <span className="absolute top-3 right-3 text-slate-500 group-hover:text-white text-sm transition-colors">
                          ✏️
                        </span>
                      </div>

                      {/* Contenido */}
                      <div className="p-4">
                        <p className="text-white font-semibold leading-tight mb-2 text-sm">{step.content}</p>
                        <NodeLabels node={step} size="sm" />
                        {step.description && (
                          <div className="mt-2">
                            <ExpandableText
                              text={step.description}
                              className="text-slate-400 text-xs leading-relaxed"
                              clamp={2}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
