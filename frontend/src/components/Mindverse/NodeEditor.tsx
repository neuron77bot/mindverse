import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useMindverseStore } from '../../store/mindverseStore';
import type { Category, TemporalState, EmotionalLevel, MindverseNode } from '../../types';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  TEMPORAL_LABELS,
  HAWKINS_SCALE,
  EMOTIONAL_COLORS,
  ROOT_NODE_ID,
} from '../../data/mockData';

const categories: Category[] = [
  'HEALTH', 'WORK', 'LOVE', 'FAMILY', 'FINANCES',
  'PERSONAL_GROWTH', 'LEISURE', 'SPIRITUALITY', 'SOCIAL',
];

const temporalStates: TemporalState[] = ['PAST', 'PRESENT', 'FUTURE'];

export default function NodeEditor() {
  const {
    isEditorOpen,
    selectedNode,
    nodes,
    connections,
    closeEditor,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
    activeTemporalFilter,
  } = useMindverseStore();

  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('HEALTH');
  const [temporalState, setTemporalState] = useState<TemporalState>('PRESENT');
  const [emotionalLevel, setEmotionalLevel] = useState<EmotionalLevel>('NEUTRALITY');
  const [inNodeId, setInNodeId] = useState<string>(ROOT_NODE_ID);
  const [outNodeId, setOutNodeId] = useState<string>('');

  const isRootNode = selectedNode?.id === ROOT_NODE_ID;

  // Nodos disponibles para los combos (todos excepto el nodo actual)
  const otherNodes = nodes.filter((n) => n.id !== selectedNode?.id);

  useEffect(() => {
    if (selectedNode) {
      setContent(selectedNode.content);
      setDescription(selectedNode.description || '');
      setCategory(selectedNode.category);
      setTemporalState(selectedNode.temporalState);
      setEmotionalLevel(selectedNode.emotionalLevel || 'NEUTRALITY');

      // Detectar IN: conexión donde target === selectedNode.id
      const inConn = connections.find((c) => c.target === selectedNode.id);
      setInNodeId(inConn?.source || '');

      // Detectar OUT: conexión donde source === selectedNode.id
      const outConn = connections.find((c) => c.source === selectedNode.id);
      setOutNodeId(outConn?.target || '');
    } else {
      setContent('');
      setDescription('');
      setCategory('HEALTH');
      setTemporalState(activeTemporalFilter === 'ALL' ? 'PRESENT' : activeTemporalFilter);
      setEmotionalLevel('NEUTRALITY');
      setInNodeId(ROOT_NODE_ID);
      setOutNodeId('');
    }
  }, [selectedNode, activeTemporalFilter, connections]);

  const handleSave = () => {
    if (!content.trim()) return;

    if (selectedNode) {
      updateNode(selectedNode.id, {
        content,
        description,
        category,
        temporalState,
        emotionalLevel,
        color: isRootNode ? '#FBBF24' : CATEGORY_COLORS[category],
      });

      if (!isRootNode) {
        // Actualizar conexión IN
        const oldInConn = connections.find((c) => c.target === selectedNode.id);
        if (oldInConn?.source !== inNodeId) {
          if (oldInConn) deleteConnection(oldInConn.id);
          if (inNodeId) addConnection({ id: uuidv4(), source: inNodeId, target: selectedNode.id });
        }

        // Actualizar conexión OUT
        const oldOutConn = connections.find((c) => c.source === selectedNode.id);
        if (oldOutConn?.target !== outNodeId) {
          if (oldOutConn) deleteConnection(oldOutConn.id);
          if (outNodeId) addConnection({ id: uuidv4(), source: selectedNode.id, target: outNodeId });
        }
      }
    } else {
      const newNode: MindverseNode = {
        id: uuidv4(),
        content,
        description,
        category,
        temporalState,
        emotionalLevel,
        positionX: Math.random() * 400 + 100,
        positionY: Math.random() * 300 + 100,
        color: CATEGORY_COLORS[category],
        createdAt: new Date(),
      };
      addNode(newNode);

      // Conexión IN
      if (inNodeId) {
        addConnection({ id: uuidv4(), source: inNodeId, target: newNode.id });
      }
      // Conexión OUT
      if (outNodeId) {
        addConnection({ id: uuidv4(), source: newNode.id, target: outNodeId });
      }
    }

    closeEditor();
  };

  const handleDelete = () => {
    if (selectedNode && !isRootNode) {
      deleteNode(selectedNode.id);
      closeEditor();
    }
  };

  if (!isEditorOpen) return null;

  const selectClass = "w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 shrink-0">
          <h2 className="text-xl font-bold text-white">
            {selectedNode
              ? isRootNode ? 'Casco Periférico' : 'Editar Pensamiento'
              : 'Nuevo Pensamiento'}
          </h2>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 overflow-y-auto">

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Pensamiento *</label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Qué pensamiento quieres registrar?"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={isRootNode}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añade más contexto sobre este pensamiento..."
              rows={3}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* IN / OUT connections */}
          {!isRootNode && (
            <div className="grid grid-cols-2 gap-3">
              {/* IN */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <span className="text-indigo-400">→</span> IN
                  <span className="text-slate-500 text-xs font-normal">(nodo entrante)</span>
                </label>
                <select
                  value={inNodeId}
                  onChange={(e) => setInNodeId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">— Ninguno —</option>
                  {otherNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.content}
                    </option>
                  ))}
                </select>
              </div>

              {/* OUT */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <span className="text-purple-400">→</span> OUT
                  <span className="text-slate-500 text-xs font-normal">(nodo saliente)</span>
                </label>
                <select
                  value={outNodeId}
                  onChange={(e) => setOutNodeId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">— Ninguno —</option>
                  {otherNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.content}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Emotional Level — Hawkins Scale */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nivel Vibracional (Hawkins)</label>
            <div className="grid grid-cols-3 gap-1.5 max-h-[180px] overflow-y-auto pr-1">
              {HAWKINS_SCALE.map((level) => (
                <button
                  key={level.key}
                  onClick={() => setEmotionalLevel(level.key)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-center ${
                    emotionalLevel === level.key
                      ? 'text-white shadow-lg scale-105 ring-2 ring-white/30'
                      : 'text-slate-300 opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor:
                      emotionalLevel === level.key
                        ? EMOTIONAL_COLORS[level.key]
                        : `${EMOTIONAL_COLORS[level.key]}40`,
                  }}
                >
                  <span className="block font-bold">{level.calibration}</span>
                  <span className="block text-[10px] leading-tight">{level.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          {!isRootNode && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      category === cat
                        ? 'text-white shadow-lg scale-105'
                        : 'text-slate-400 bg-slate-700 hover:bg-slate-600'
                    }`}
                    style={category === cat ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Temporal State */}
          {!isRootNode && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Línea Temporal</label>
              <div className="flex gap-2">
                {temporalStates.map((state) => (
                  <button
                    key={state}
                    onClick={() => setTemporalState(state)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      temporalState === state
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                    }`}
                  >
                    {TEMPORAL_LABELS[state]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-900/50 flex justify-between border-t border-slate-700 shrink-0">
          <div>
            {selectedNode && !isRootNode && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
              >
                Eliminar
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={closeEditor}
              className="px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
            >
              {selectedNode ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
