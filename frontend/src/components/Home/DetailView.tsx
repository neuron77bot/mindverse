import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMindverseStore } from '../../store/mindverseStore';
import { CATEGORY_COLORS, CATEGORY_LABELS, EMOTIONAL_COLORS, HAWKINS_SCALE } from '../../data/mockData';
import type { MindverseNode } from '../../types';
import ExpandableText from '../UI/ExpandableText';
import MermaidDiagram from '../UI/MermaidDiagram';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'esquema'>('grid');
  const navigate = useNavigate();

  const color    = CATEGORY_COLORS[node.category] || '#6366F1';
  const vibColor = EMOTIONAL_COLORS[node.emotionalLevel] || color;

  // BFS para obtener TODOS los descendientes
  const steps: MindverseNode[] = [];
  const visited = new Set<string>([node.id]);
  const queue = [node.id];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const childIds = connections
      .filter((c) => c.source === current && !visited.has(c.target))
      .map((c) => c.target);

    for (const childId of childIds) {
      const childNode = nodes.find((n) => n.id === childId);
      if (childNode) {
        visited.add(childId);
        queue.push(childId);
        steps.push(childNode);
      }
    }
  }

  // Generar código Mermaid para el esquema
  const mermaidCode = useMemo(() => {
    if (steps.length === 0) return '';

    const allNodeIds = new Set([node.id, ...steps.map((s) => s.id)]);
    const relevantConns = connections.filter(
      (c) => allNodeIds.has(c.source) && allNodeIds.has(c.target)
    );

    const sanitize = (text: string) => text.replace(/["\n]/g, ' ').substring(0, 40);
    
    let code = 'graph TD\n';
    
    // Nodo raíz
    code += `  ROOT["${sanitize(node.content)}"]\n`;
    code += `  style ROOT fill:${vibColor},stroke:${vibColor},color:#fff\n`;

    // Nodos hijos
    steps.forEach((step, idx) => {
      const stepColor = EMOTIONAL_COLORS[step.emotionalLevel] || CATEGORY_COLORS[step.category] || '#6366F1';
      code += `  N${idx}["${sanitize(step.content)}"]\n`;
      code += `  style N${idx} fill:${stepColor},stroke:${stepColor},color:#fff\n`;
    });

    // Conexiones
    relevantConns.forEach((conn) => {
      const sourceLabel = conn.source === node.id ? 'ROOT' : `N${steps.findIndex((s) => s.id === conn.source)}`;
      const targetLabel = conn.target === node.id ? 'ROOT' : `N${steps.findIndex((s) => s.id === conn.target)}`;
      if (sourceLabel && targetLabel && !sourceLabel.includes('-1') && !targetLabel.includes('-1')) {
        code += `  ${sourceLabel} --> ${targetLabel}\n`;
      }
    });

    return code;
  }, [node, steps, connections, vibColor]);

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
            <div className="relative w-full overflow-hidden aspect-square shrink-0">
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
                {node.isFavorite && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⭐</span>
                    <span className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Favorito</span>
                  </div>
                )}
                <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
                  {node.content}
                </h1>
                <NodeLabels node={node} size="md" />
                
                {/* Tags */}
                {node.tags && node.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {node.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-1 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
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
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                Pasos
                <span
                  className="text-sm font-medium px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${vibColor}20`, color: vibColor }}
                >
                  {steps.length}
                </span>
              </h2>
              
              <div className="flex items-center gap-2">
                {/* Toggle Grid/List/Esquema */}
                {steps.length > 0 && (
                  <div className="flex rounded-lg overflow-hidden border border-slate-700">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                        viewMode === 'grid' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                      title="Vista grid"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                        viewMode === 'list' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                      title="Vista lista"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('esquema')}
                      className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                        viewMode === 'esquema' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                      title="Vista esquema"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditor(undefined, node.id)}
                    className="text-sm px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg font-medium transition-all flex items-center gap-1.5"
                  >
                    + Agregar paso
                  </button>
                  <button
                    onClick={() => navigate(`/recording/${node.id}`)}
                    className="text-sm px-3 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg font-medium transition-all flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    Generar Storyboard
                  </button>
                </div>
              </div>
            </div>

            {steps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl mb-4">
                  🧩
                </div>
                <p className="text-slate-400 font-medium mb-1">Sin pasos definidos</p>
                <p className="text-slate-600 text-sm mb-5">Agregá el primer paso para este pensamiento</p>
                <button
                  onClick={() => openEditor(undefined, node.id)}
                  className="text-sm px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-medium"
                >
                  + Agregar primer paso
                </button>
              </div>
            ) : viewMode === 'esquema' ? (
              /* ── Vista Esquema ─────────────────────────────────────────────── */
              <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-6 overflow-x-auto">
                <MermaidDiagram chart={mermaidCode} className="flex justify-center" />
              </div>
            ) : viewMode === 'list' ? (
              /* ── Vista Lista ───────────────────────────────────────────────── */
              <div className="space-y-2">
                {steps.map((step, idx) => {
                  const stepVibColor = EMOTIONAL_COLORS[step.emotionalLevel] || CATEGORY_COLORS[step.category] || '#6366F1';
                  return (
                    <div
                      key={step.id}
                      className="flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md"
                      style={{ backgroundColor: `${stepVibColor}08`, borderColor: `${stepVibColor}25` }}
                      onClick={() => openEditor(step)}
                    >
                      {/* Número */}
                      <div
                        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
                        style={{ backgroundColor: stepVibColor }}
                      >
                        {idx + 1}
                      </div>
                      
                      {/* Thumbnail */}
                      <div className="relative shrink-0 w-12 h-12 rounded overflow-hidden">
                        {step.imageUrl ? (
                          <img src={step.imageUrl} alt={step.content} className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${stepVibColor}25 0%, ${stepVibColor}10 100%)` }}
                          >
                            <span className="text-[8px] font-semibold tracking-widest uppercase opacity-30 text-white">IMG</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm mb-1 line-clamp-1">{step.content}</p>
                        <NodeLabels node={step} size="sm" />
                      </div>

                      {/* Edit hint */}
                      <div className="shrink-0 text-slate-500 hover:text-white text-sm transition-colors">
                        ✏️
                      </div>
                    </div>
                  );
                })}
                
                {/* Card "Nuevo paso" en lista */}
                <button
                  onClick={() => openEditor(undefined, node.id)}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-slate-700 hover:border-indigo-500/60 hover:bg-indigo-500/5 transition-all text-slate-500 hover:text-indigo-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">Nuevo paso</span>
                </button>
              </div>
            ) : (
              /* ── Vista Grid ────────────────────────────────────────────────── */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
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
                      <div className="relative w-full overflow-hidden aspect-square">
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

                {/* Card "Nuevo paso" */}
                <button
                  onClick={() => openEditor(undefined, node.id)}
                  className="rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500/60 hover:bg-indigo-500/5 transition-all duration-200 group flex flex-col items-center justify-center gap-3 h-full min-h-48 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-indigo-600/20 border border-slate-600 group-hover:border-indigo-500/50 flex items-center justify-center transition-all">
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-500 group-hover:text-indigo-400 transition-colors">Nuevo paso</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
