import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useMindverseStore } from '../../store/mindverseStore';
import type { Category, TemporalState, MindverseNode } from '../../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, TEMPORAL_LABELS } from '../../data/mockData';

const categories: Category[] = [
  'HEALTH',
  'WORK',
  'LOVE',
  'FAMILY',
  'FINANCES',
  'PERSONAL_GROWTH',
  'LEISURE',
  'SPIRITUALITY',
  'SOCIAL',
];

const temporalStates: TemporalState[] = ['PAST', 'PRESENT', 'FUTURE'];

export default function NodeEditor() {
  const {
    isEditorOpen,
    selectedNode,
    closeEditor,
    addNode,
    updateNode,
    deleteNode,
    activeTemporalFilter,
  } = useMindverseStore();

  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('HEALTH');
  const [temporalState, setTemporalState] = useState<TemporalState>('PRESENT');

  useEffect(() => {
    if (selectedNode) {
      setContent(selectedNode.content);
      setDescription(selectedNode.description || '');
      setCategory(selectedNode.category);
      setTemporalState(selectedNode.temporalState);
    } else {
      setContent('');
      setDescription('');
      setCategory('HEALTH');
      setTemporalState(
        activeTemporalFilter === 'ALL' ? 'PRESENT' : activeTemporalFilter
      );
    }
  }, [selectedNode, activeTemporalFilter]);

  const handleSave = () => {
    if (!content.trim()) return;

    if (selectedNode) {
      updateNode(selectedNode.id, {
        content,
        description,
        category,
        temporalState,
        color: CATEGORY_COLORS[category],
      });
    } else {
      const newNode: MindverseNode = {
        id: uuidv4(),
        content,
        description,
        category,
        temporalState,
        positionX: Math.random() * 400 + 100,
        positionY: Math.random() * 300 + 100,
        color: CATEGORY_COLORS[category],
        createdAt: new Date(),
      };
      addNode(newNode);
    }

    closeEditor();
  };

  const handleDelete = () => {
    if (selectedNode) {
      deleteNode(selectedNode.id);
      closeEditor();
    }
  };

  if (!isEditorOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
          <h2 className="text-xl font-bold text-white">
            {selectedNode ? 'Editar Nodo' : 'Nuevo Nodo'}
          </h2>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Qué representa este nodo?"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añade más detalles..."
              rows={3}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Categoría
            </label>
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
                  style={
                    category === cat
                      ? { backgroundColor: CATEGORY_COLORS[cat] }
                      : {}
                  }
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Temporal State */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Estado Temporal
            </label>
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
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-900/50 flex justify-between border-t border-slate-700">
          <div>
            {selectedNode && (
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
