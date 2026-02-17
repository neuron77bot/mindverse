import { useState } from 'react';
import { useMindverseStore } from '../../store/mindverseStore';
import { CATEGORY_COLORS, CATEGORY_LABELS, ROOT_NODE_ID } from '../../data/mockData';
import type { MindverseNode } from '../../types';

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

const CATEGORY_ICONS: Record<string, string> = {
  HEALTH: '💪',
  FINANCES: '💰',
  WORK: '💼',
  LOVE: '❤️',
  FAMILY: '👨‍👩‍👧',
  PERSONAL_GROWTH: '🚀',
  LEISURE: '🎉',
  SPIRITUALITY: '🔮',
  SOCIAL: '🤝',
};

interface StepsModalProps {
  node: MindverseNode;
  steps: MindverseNode[];
  onClose: () => void;
}

function StepsModal({ node, steps, onClose }: StepsModalProps) {
  const color = CATEGORY_COLORS[node.category] || '#6366F1';

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 w-full sm:max-w-lg sm:mx-4 rounded-t-3xl sm:rounded-2xl border border-slate-700 overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-start justify-between gap-3 shrink-0"
          style={{ borderBottom: `2px solid ${color}40` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: `${color}25` }}
            >
              {CATEGORY_ICONS[node.category]}
            </div>
            <div>
              <h3 className="text-white font-bold text-base leading-tight">{node.content}</h3>
              <span className="text-xs" style={{ color }}>{CATEGORY_LABELS[node.category]}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors mt-0.5 shrink-0 p-1"
          >
            ✕
          </button>
        </div>

        {/* Descripción */}
        {node.description && (
          <div className="px-5 py-3 bg-slate-900/50 text-slate-400 text-sm border-b border-slate-700 shrink-0">
            {node.description}
          </div>
        )}

        {/* Lista de pasos */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {steps.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Sin pasos definidos aún</p>
          ) : (
            <div className="space-y-3">
              {steps.map((step, idx) => {
                const stepColor = CATEGORY_COLORS[step.category] || '#6366F1';
                return (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700"
                  >
                    {/* Número */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: `${stepColor}25`, color: stepColor }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium leading-tight">{step.content}</p>
                      {step.description && (
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{step.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${stepColor}20`, color: stepColor }}
                        >
                          {CATEGORY_LABELS[step.category]}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {TEMPORAL_ICONS[step.temporalState]} {TEMPORAL_LABELS_MAP[step.temporalState]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-700 shrink-0">
          <p className="text-xs text-slate-500 text-center">
            {steps.length} {steps.length === 1 ? 'paso' : 'pasos'} · {TEMPORAL_LABELS_MAP[node.temporalState]}
          </p>
        </div>
      </div>
    </div>
  );
}

interface HomeViewProps {
  onNavigateToMap: () => void;
}

export default function HomeView({ onNavigateToMap }: HomeViewProps) {
  const { nodes, connections, openEditor } = useMindverseStore();
  const [selectedNode, setSelectedNode] = useState<MindverseNode | null>(null);

  // Nodos directamente conectados al root
  const rootConnectionTargets = connections
    .filter((c) => c.source === ROOT_NODE_ID)
    .map((c) => c.target);

  const mainNodes = nodes.filter((n) => rootConnectionTargets.includes(n.id));

  // Obtener los pasos (hijos directos) de un nodo
  const getSteps = (nodeId: string): MindverseNode[] => {
    const childIds = connections
      .filter((c) => c.source === nodeId)
      .map((c) => c.target);
    return nodes.filter((n) => childIds.includes(n.id));
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
      {/* Encabezado */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Mis pensamientos</h2>
        <p className="text-slate-400 text-sm">
          {mainNodes.length} tópicos conectados al Casco Periférico
        </p>
      </div>

      {/* Grid de cards */}
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
            const steps = getSteps(node.id);

            return (
              <div
                key={node.id}
                className="group bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden transition-all duration-200 hover:border-slate-500 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Barra de color */}
                <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

                <div className="p-5">
                  {/* Header */}
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

                  {/* Footer con botones */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700 gap-2">
                    {/* Ver pasos */}
                    <button
                      onClick={() => setSelectedNode(node)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${color}15`,
                        color,
                      }}
                    >
                      📋 {steps.length} {steps.length === 1 ? 'paso' : 'pasos'}
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

          {/* Card agregar */}
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

      {/* Modal de pasos */}
      {selectedNode && (
        <StepsModal
          node={selectedNode}
          steps={getSteps(selectedNode.id)}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
