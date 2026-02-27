import { useState } from 'react';
import { toast } from 'sonner';
import type { NavigateFunction } from 'react-router-dom';
import type { StoryboardFrame, InputMode } from './types';
import { authHeadersOnly } from '../../../services/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface EditorHeaderProps {
  navigate: NavigateFunction;
  isEditMode: boolean;
  id: string | undefined;
  storyboardTitle: string;
  setStoryboardTitle: (title: string) => void;
  storyboard: StoryboardFrame[] | null;
  inputMode: InputMode;
  isSaving: boolean;
  saveStoryboard: () => void;
  allowCinema?: boolean;
  onCinemaToggle?: (newValue: boolean) => void;
}

export default function EditorHeader({
  navigate,
  isEditMode,
  id,
  storyboardTitle,
  setStoryboardTitle,
  storyboard,
  inputMode,
  isSaving,
  saveStoryboard,
  allowCinema,
  onCinemaToggle,
}: EditorHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isTogglingCinema, setIsTogglingCinema] = useState(false);

  const handleToggleCinema = async () => {
    if (!id || !onCinemaToggle) return;
    const newValue = !allowCinema;
    setIsTogglingCinema(true);

    toast.promise(
      async () => {
        const res = await fetch(`${API_BASE}/storyboards/${id}/cinema-visibility`, {
          method: 'PATCH',
          headers: {
            ...authHeadersOnly(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ allowCinema: newValue }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Error actualizando visibilidad en Cinema');
        }

        onCinemaToggle(newValue);

        return newValue
          ? 'Storyboard visible en Cinema Mode'
          : 'Storyboard oculto de Cinema Mode';
      },
      {
        loading: 'Actualizando visibilidad...',
        success: (msg) => msg,
        error: (err) => err.message || 'No se pudo actualizar la visibilidad',
        finally: () => setIsTogglingCinema(false),
      }
    );
  };

  return (
    <div className="bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(isEditMode ? `/storyboard/detail/${id}` : '/storyboards')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {isEditMode ? 'Volver al detalle' : 'Volver'}
          </button>

          {isEditMode && storyboard && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleCinema}
                disabled={isTogglingCinema}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 border border-purple-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title={allowCinema ? 'Ocultar de Cinema Mode' : 'Mostrar en Cinema Mode'}
              >
                {isTogglingCinema ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <span>{allowCinema ? '🎬' : '🎬'}</span>
                )}
                <span className="hidden sm:inline">
                  {allowCinema ? 'En Cinema' : 'Cinema'}
                </span>
              </button>

              <button
                onClick={saveStoryboard}
                disabled={isSaving || !storyboardTitle.trim()}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all duration-200 shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Hero Content */}
        <div className="space-y-4">
          {isEditMode && isEditingTitle ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={storyboardTitle}
                onChange={(e) => setStoryboardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false);
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                onBlur={() => setIsEditingTitle(false)}
                autoFocus
                className="flex-1 text-4xl md:text-5xl font-bold bg-slate-800/50 border-2 border-indigo-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Título del storyboard"
              />
              <button
                onClick={() => setIsEditingTitle(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Finalizar edición (Enter/Esc)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className={isEditMode ? 'group flex items-center gap-3' : ''}>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {isEditMode ? storyboardTitle || 'Sin título' : 'Crear Storyboard'}
              </h1>
              {isEditMode && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                  title="Editar título"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Metadata Badges */}
          <div className="flex flex-wrap gap-2">
            {storyboard && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                  />
                </svg>
                {storyboard.length} frames
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium">
              {inputMode === 'voice' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  Entrada: Voz
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Entrada: Texto
                </>
              )}
            </span>

            {isEditMode && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Modo edición
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
