import type { LightboxImage } from './types';

interface LightboxModalProps {
  lightboxImage: LightboxImage;
  onClose: () => void;
}

export default function LightboxModal({ lightboxImage, onClose }: LightboxModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-7xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-4 shrink-0">
          <h3 className="text-white font-semibold text-lg">{lightboxImage.title}</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden min-h-0"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={lightboxImage.url}
            alt={lightboxImage.title}
            className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl"
          />
        </div>

        {/* Download */}
        <div className="flex justify-center mt-4 shrink-0">
          <a
            href={lightboxImage.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Abrir en nueva pestaña
          </a>
        </div>
      </div>
    </div>
  );
}
