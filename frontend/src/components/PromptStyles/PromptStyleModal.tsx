import { useState, useEffect } from 'react';
import type { PromptStyleTag } from '../../types/promptStyle';

interface PromptStyleModalProps {
  tag: PromptStyleTag | null;
  onClose: () => void;
  onSave: (data: { name: string; description?: string; promptText: string }) => void;
}

export default function PromptStyleModal({ tag, onClose, onSave }: PromptStyleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promptText, setPromptText] = useState('');

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setDescription(tag.description || '');
      setPromptText(tag.promptText);
    }
  }, [tag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !promptText.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      promptText: promptText.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-2xl w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">
          {tag ? 'Editar Tag de Estilo' : 'Crear Tag de Estilo'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: cyberpunk, watercolor, vintage"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del estilo"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Prompt Text */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Texto del Prompt <span className="text-red-400">*</span>
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="ej: futuristic neon city, cyberpunk aesthetic, high contrast"
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              required
            />
            <p className="text-slate-500 text-xs mt-1">
              Este texto se concatenará automáticamente a tus prompts de generación
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !promptText.trim()}
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {tag ? 'Guardar Cambios' : 'Crear Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
