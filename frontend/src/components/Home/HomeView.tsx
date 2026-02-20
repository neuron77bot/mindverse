import { useMindverseStore } from '../../store/mindverseStore';
import { CATEGORY_COLORS, CATEGORY_LABELS, EMOTIONAL_COLORS, HAWKINS_SCALE, ROOT_NODE_ID } from '../../data/mockData';
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

interface HomeViewProps {
  onNavigateToMap: (nodeId?: string) => void;
  onNavigateToDetail: (node: MindverseNode) => void;
}

export default function HomeView({ onNavigateToMap, onNavigateToDetail }: HomeViewProps) {
  const { nodes, connections, openEditor } = useMindverseStore();

  const rootConnectionTargets = connections
    .filter((c) => c.source === ROOT_NODE_ID)
    .map((c) => c.target);

  const mainNodes = nodes.filter((n) => rootConnectionTargets.includes(n.id));

  const getStepCount = (nodeId: string): number => {
    const visited = new Set<string>([nodeId]);
    const queue = [nodeId];
    let count = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = connections
        .filter((c) => c.source === current && !visited.has(c.target))
        .map((c) => c.target);

      for (const child of children) {
        visited.add(child);
        queue.push(child);
        count++;
      }
    }
    return count;
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mainNodes.map((node) => {
            const color = CATEGORY_COLORS[node.category] || '#6366F1';
            const vibColor = EMOTIONAL_COLORS[node.emotionalLevel] || color;
            const hawkins = HAWKINS_SCALE.find((l) => l.key === node.emotionalLevel);
            const freq = hawkins ? getFreqLabel(hawkins.calibration) : null;
            const stepCount = getStepCount(node.id);

            return (
              <div
                key={node.id}
                className="group rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
                style={{
                  backgroundColor: `${vibColor}18`,
                  borderColor: `${vibColor}40`,
                }}
              >
                {/* Banner: imagen real o placeholder */}
                <div className="relative w-full overflow-hidden aspect-square">
                  {node.imageUrl ? (
                    <img
                      src={node.imageUrl}
                      alt={node.content}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${vibColor}25 0%, ${vibColor}10 100%)` }}
                    >
                      <span className="text-xs font-semibold tracking-widest uppercase opacity-30 text-white">
                        Sin imagen
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow">
                      {node.content}
                    </h3>
                  </div>
                </div>

                <div className="p-5">
                  {/* Labels: vibración + frecuencia + categoría + temporal */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-700/60 text-[10px] text-slate-300 font-medium">
                      {TEMPORAL_ICONS[node.temporalState]} {TEMPORAL_LABELS_MAP[node.temporalState]}
                    </span>
                    {hawkins && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold"
                        style={{ borderColor: `${vibColor}50`, color: vibColor, backgroundColor: `${vibColor}15` }}
                      >
                        {hawkins.label} · {hawkins.calibration}
                      </span>
                    )}
                    {freq && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ color: freq.color, backgroundColor: freq.bg }}
                      >
                        {freq.icon} {freq.label}
                      </span>
                    )}
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {CATEGORY_ICONS[node.category]} {CATEGORY_LABELS[node.category]}
                    </span>
                  </div>

                  {node.description && (
                    <div className="mb-4">
                      <ExpandableText
                        text={node.description}
                        className="text-slate-400 text-sm leading-relaxed"
                        clamp={2}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t gap-2" style={{ borderColor: `${vibColor}25` }}>
                    {/* Ver detalle */}
                    <button
                      onClick={() => onNavigateToDetail(node)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                      style={{ backgroundColor: `${vibColor}25`, color: vibColor }}
                    >
                      📋 {stepCount} {stepCount === 1 ? 'paso' : 'pasos'}
                    </button>

                    {/* Ver en mapa */}
                    <button
                      onClick={() => onNavigateToMap(node.id)}
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
