import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MermaidDiagram from '../UI/MermaidDiagram';
import { authHeadersOnly } from '../../services/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type InputMode = 'voice' | 'text';

interface StoryboardFrame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
  imageUrl?: string;
}

interface StoryboardDetail {
  title?: string;
  originalText?: string;
  inputMode?: InputMode;
  frames?: StoryboardFrame[];
  mermaidDiagram?: string | null;
  comicPageUrl?: string | null;
}

export default function StoryboardDetailView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [storyboard, setStoryboard] = useState<StoryboardDetail | null>(null);

  useEffect(() => {
    const loadStoryboard = async () => {
      if (!id) {
        setError('No se encontro el storyboard solicitado.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/storyboards/${id}`, {
          headers: authHeadersOnly(),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Error cargando storyboard');
        }

        const data = await res.json();
        setStoryboard(data.storyboard ?? null);
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar el storyboard.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStoryboard();
  }, [id]);

  const frames = storyboard?.frames ?? [];
  const originalText = storyboard?.originalText ?? '';
  const inputMode = storyboard?.inputMode ?? 'text';

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/storyboards')}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-colors"
        >
          Volver a Storyboards
        </button>
      </div>

      {isLoading && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
          Cargando storyboard...
        </div>
      )}

      {!isLoading && error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {!isLoading && !error && storyboard && (
        <div className="space-y-6">
          <section className="p-6 bg-slate-900 rounded-xl border border-slate-700">
            <h1 className="text-2xl font-bold text-white mb-2">
              {storyboard.title || 'Storyboard'}
            </h1>
            <p className="text-slate-400 text-sm">
              {inputMode === 'voice' ? 'Entrada: Voz' : 'Entrada: Texto'}
            </p>
          </section>

          {originalText && (
            <section className="p-6 bg-slate-900 rounded-xl border border-slate-700">
              <h2 className="text-white font-semibold mb-3">Historia original</h2>
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{originalText}</p>
            </section>
          )}

          <section className="p-6 bg-slate-900 rounded-xl border border-slate-700">
            <h2 className="text-white font-semibold mb-4">
              Storyboard ({frames.length} Frames)
            </h2>

            {frames.length === 0 ? (
              <p className="text-slate-400">No hay Frames para este storyboard.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {frames.map((frame) => (
                  <article
                    key={frame.frame}
                    className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-slate-700 bg-slate-700/40">
                      <h3 className="text-white font-medium">
                        Frame {frame.frame}: {frame.scene}
                      </h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                          Descripcion visual
                        </p>
                        <p className="text-slate-300">{frame.visualDescription}</p>
                      </div>

                      {frame.dialogue && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                            Dialogo
                          </p>
                          <p className="text-slate-200 italic">"{frame.dialogue}"</p>
                        </div>
                      )}

                      {frame.imageUrl && (
                        <div className="rounded border border-slate-700 overflow-hidden">
                          <img
                            src={frame.imageUrl}
                            alt={`Frame ${frame.frame}`}
                            className="w-full h-auto"
                          />
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {storyboard.comicPageUrl && (
            <section className="p-6 bg-slate-900 rounded-xl border border-slate-700">
              <h2 className="text-white font-semibold mb-4">Pagina de comic</h2>
              <div className="rounded border border-slate-700 overflow-hidden mb-3">
                <img src={storyboard.comicPageUrl} alt="Pagina de comic" className="w-full h-auto" />
              </div>
              <a
                href={storyboard.comicPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Abrir imagen en nueva pestaña
              </a>
            </section>
          )}

          {storyboard.mermaidDiagram && (
            <section className="p-6 bg-slate-900 rounded-xl border border-slate-700">
              <h2 className="text-white font-semibold mb-4">Timeline</h2>
              <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                <MermaidDiagram chart={storyboard.mermaidDiagram} />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
