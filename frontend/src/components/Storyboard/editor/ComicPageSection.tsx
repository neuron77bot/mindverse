import type { StoryboardFrame } from './types';

interface ComicPageSectionProps {
  storyboard: StoryboardFrame[];
  comicPageUrl: string | null;
  isGeneratingComic: boolean;
  generateComicPage: () => void;
  setComicPageUrl: (url: string | null) => void;
}

export default function ComicPageSection({
  storyboard,
  comicPageUrl,
  isGeneratingComic,
  generateComicPage,
  setComicPageUrl,
}: ComicPageSectionProps) {
  if (comicPageUrl) {
    return (
      <div className="mb-6 p-4 bg-gradient-to-br from-slate-900 to-black rounded-xl border-2 border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
            Página de Cómic Generada
          </h4>
          <div className="flex gap-2">
            <a
              href={comicPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              title="Abrir en nueva pestaña"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
            <button
              onClick={() => setComicPageUrl(null)}
              className="text-slate-400 hover:text-white transition-colors"
              title="Cerrar imagen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="rounded-lg overflow-hidden border-2 border-slate-700">
          <img src={comicPageUrl} alt="Página de cómic generada" className="w-full h-auto" />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={generateComicPage}
            disabled={isGeneratingComic}
            className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Regenerar
          </button>
          <a
            href={comicPageUrl}
            download="comic-page.png"
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors text-center"
          >
            Descargar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <button
        onClick={generateComicPage}
        disabled={isGeneratingComic}
        className="w-full py-4 px-6 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-slate-600 shadow-lg"
      >
        {isGeneratingComic ? (
          <>
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
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
            <span className="text-lg">Generando página de cómic...</span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-lg">Generar Página de Cómic Completa</span>
          </>
        )}
      </button>
      <p className="text-center text-slate-500 text-xs mt-2">
        Genera una imagen única con todas las {storyboard.length} viñetas en formato página de cómic
        B&N
      </p>
    </div>
  );
}
