import { useState } from 'react';
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
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const rootConnectionTargets = connections
    .filter((c) => c.source === ROOT_NODE_ID)
    .map((c) => c.target);

  const allMainNodes = nodes.filter((n) => rootConnectionTargets.includes(n.id));
  const mainNodes = showOnlyFavorites
    ? allMainNodes.filter((n) => n.isFavorite)
    : allMainNodes;

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

      {/* Botón nuevo pensamiento + filtro favoritos + toggle vista */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-medium text-sm shadow-lg shadow-indigo-500/25"
        >
          <span className="text-lg leading-none">+</span> Nuevo pensamiento
        </button>
        <button
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm ${
            showOnlyFavorites
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <span>⭐</span> {showOnlyFavorites ? 'Todos' : 'Favoritos'}
        </button>
        
        {/* Toggle Grid/List */}
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
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
      ) : viewMode === 'list' ? (
        /* ── Vista Lista ──────────────────────────────────────────────────── */
        <div className="space-y-2">
          {mainNodes.map((node) => {
            const color = CATEGORY_COLORS[node.category] || '#6366F1';
            const vibColor = EMOTIONAL_COLORS[node.emotionalLevel] || color;
            const hawkins = HAWKINS_SCALE.find((l) => l.key === node.emotionalLevel);
            const stepCount = getStepCount(node.id);

            return (
              <div
                key={node.id}
                className="group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:shadow-lg cursor-pointer"
                style={{ backgroundColor: `${vibColor}10`, borderColor: `${vibColor}30` }}
                onClick={() => onNavigateToDetail(node)}
              >
                {/* Thumbnail pequeño */}
                <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden">
                  {node.imageUrl ? (
                    <img src={node.imageUrl} alt={node.content} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${vibColor}25 0%, ${vibColor}10 100%)` }}
                    >
                      <span className="text-[8px] font-semibold tracking-widest uppercase opacity-30 text-white">IMG</span>
                    </div>
                  )}
                  {node.isFavorite && (
                    <div className="absolute top-1 right-1">
                      <span className="text-sm drop-shadow">⭐</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-base mb-1 line-clamp-1">{node.content}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {hawkins && (
                      <span
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold"
                        style={{ borderColor: `${vibColor}50`, color: vibColor, backgroundColor: `${vibColor}15` }}
                      >
                        {hawkins.calibration}
                      </span>
                    )}
                    <span
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {CATEGORY_ICONS[node.category]}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-700/40 text-[10px] text-slate-400 font-medium">
                      {stepCount} paso{stepCount !== 1 ? 's' : ''}
                    </span>
                    {node.tags && node.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 bg-emerald-600/20 text-emerald-300 text-[10px] font-medium rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {node.description && (
                    <p className="text-slate-400 text-xs line-clamp-1">{node.description}</p>
                  )}
                </div>

                {/* Acción rápida */}
                <div className="shrink-0 hidden sm:flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditor(node); }}
                    className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onNavigateToMap(node.id); }}
                    className="p-2 text-slate-500 hover:text-purple-400 transition-colors"
                    title="Ver en mapa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Vista Grid ───────────────────────────────────────────────────── */
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
                  {node.isFavorite && (
                    <div className="absolute top-2 right-2">
                      <span className="text-2xl drop-shadow-lg">⭐</span>
                    </div>
                  )}
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

                  {/* Tags */}
                  {node.tags && node.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {node.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

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
