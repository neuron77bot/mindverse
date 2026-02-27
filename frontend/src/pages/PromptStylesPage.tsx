import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authHeadersOnly } from '../services/authHeaders';
import type { PromptStyleTag } from '../types/promptStyle';
import PromptStyleModal from '../components/PromptStyles/PromptStyleModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export default function PromptStylesPage() {
  const [tags, setTags] = useState<PromptStyleTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<PromptStyleTag | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/prompt-styles`, {
        headers: authHeadersOnly(),
      });

      if (!res.ok) throw new Error('Error cargando tags');

      const data = await res.json();
      setTags(data.tags || []);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTag(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tag: PromptStyleTag) => {
    setEditingTag(tag);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este tag de estilo?')) return;

    toast.promise(
      async () => {
        const res = await fetch(`${API_BASE}/prompt-styles/${id}`, {
          method: 'DELETE',
          headers: authHeadersOnly(),
        });

        if (!res.ok) throw new Error('Error eliminando tag');

        setTags(tags.filter((t) => t._id !== id));
      },
      {
        loading: 'Eliminando...',
        success: 'Tag eliminado',
        error: (err) => err.message || 'Error al eliminar',
      }
    );
  };

  const handleSave = async (data: { name: string; description?: string; promptText: string }) => {
    const isEdit = !!editingTag;
    const url = isEdit
      ? `${API_BASE}/prompt-styles/${editingTag._id}`
      : `${API_BASE}/prompt-styles`;
    const method = isEdit ? 'PATCH' : 'POST';

    toast.promise(
      async () => {
        const res = await fetch(url, {
          method,
          headers: {
            ...authHeadersOnly(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error('Error guardando tag');

        await fetchTags();
        setIsModalOpen(false);
      },
      {
        loading: isEdit ? 'Actualizando...' : 'Creando...',
        success: isEdit ? 'Tag actualizado' : 'Tag creado',
        error: (err) => err.message || 'Error al guardar',
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Tags de Estilo de Prompt</h1>
            <p className="text-slate-400">
              Crea estilos reutilizables para tus generaciones de imágenes
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Crear Tag
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && tags.length === 0 && (
          <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
            <svg
              className="w-16 h-16 text-slate-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <p className="text-slate-400 text-lg mb-4">No hay tags de estilo</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              Crear el primero
            </button>
          </div>
        )}

        {/* Tags grid */}
        {!loading && tags.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tags.map((tag) => (
              <div
                key={tag._id}
                className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-1">{tag.name}</h3>
                    {tag.description && <p className="text-slate-400 text-sm">{tag.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded transition-colors"
                      title="Editar"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(tag._id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="Eliminar"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                  <p className="text-slate-300 text-sm font-mono">{tag.promptText}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <PromptStyleModal
          tag={editingTag}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
