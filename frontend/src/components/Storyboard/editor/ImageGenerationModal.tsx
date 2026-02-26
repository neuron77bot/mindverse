import type { StoryboardFrame, ImageMode } from './types';

interface ImageGenerationModalProps {
  selectedFrame: StoryboardFrame;
  generatingFrame: number | null;
  imageMode: ImageMode;
  setImageMode: (mode: ImageMode) => void;
  imagePrompt: string;
  setImagePrompt: (value: string) => void;
  imageUrlInput: string;
  setImageUrlInput: (value: string) => void;
  refImageFiles: File[];
  setRefImageFiles: (files: File[]) => void;
  refImagePreviews: string[];
  setRefImagePreviews: (previews: string[]) => void;
  imageError: string | null;
  setImageError: (error: string | null) => void;
  galleryTags: string[];
  selectedGalleryTags: string[];
  setSelectedGalleryTags: React.Dispatch<React.SetStateAction<string[]>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onGenerate: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveRefImage: (index: number) => void;
}

const MODE_OPTIONS: { key: ImageMode; label: string; icon: string }[] = [
  { key: 'text', label: 'Text to Image', icon: '✨' },
  { key: 'img2img', label: 'Image to Image', icon: '🖼️' },
  { key: 'gallery', label: 'Gallery Reference', icon: '📸' },
  { key: 'url', label: 'URL', icon: '🔗' },
];

export default function ImageGenerationModal({
  selectedFrame,
  generatingFrame,
  imageMode,
  setImageMode,
  imagePrompt,
  setImagePrompt,
  imageUrlInput,
  setImageUrlInput,
  refImageFiles,
  setRefImageFiles,
  refImagePreviews,
  setRefImagePreviews,
  imageError,
  setImageError,
  galleryTags,
  selectedGalleryTags,
  setSelectedGalleryTags,
  fileInputRef,
  onClose,
  onGenerate,
  onFileChange,
  onRemoveRefImage,
}: ImageGenerationModalProps) {
  const isGenerating = generatingFrame === selectedFrame.frame;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">
              Generar Imagen - Frame #{selectedFrame.frame}
            </h3>
            <p className="text-slate-400 text-sm mt-1">{selectedFrame.scene}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
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

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {MODE_OPTIONS.map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setImageMode(m.key);
                setImageError(null);
              }}
              className={`py-3 px-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 rounded-lg border ${
                imageMode === m.key
                  ? 'bg-violet-600 text-white border-violet-500 shadow-lg'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Mode content */}
        <div className="space-y-4 mb-6">
          {imageMode === 'text' && <PromptField value={imagePrompt} onChange={setImagePrompt} />}

          {imageMode === 'img2img' && (
            <>
              <PromptField
                value={imagePrompt}
                onChange={setImagePrompt}
                placeholder="Describí qué querés generar a partir de la referencia..."
                rows={3}
              />
              <ReferenceImagePicker
                refImageFiles={refImageFiles}
                setRefImageFiles={setRefImageFiles}
                refImagePreviews={refImagePreviews}
                setRefImagePreviews={setRefImagePreviews}
                fileInputRef={fileInputRef}
                onFileChange={onFileChange}
                onRemoveRefImage={onRemoveRefImage}
              />
            </>
          )}

          {imageMode === 'url' && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">URL de imagen</label>
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
              />
            </div>
          )}

          {imageMode === 'gallery' && (
            <>
              <PromptField
                value={imagePrompt}
                onChange={setImagePrompt}
                placeholder="Describí qué querés generar con las imágenes de referencia..."
                rows={3}
              />
              <GalleryTagPicker
                galleryTags={galleryTags}
                selectedGalleryTags={selectedGalleryTags}
                setSelectedGalleryTags={setSelectedGalleryTags}
              />
            </>
          )}

          {imageError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {imageError}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex-1 py-3 px-6 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/20"
          >
            {isGenerating ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando…
              </>
            ) : imageMode === 'url' ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Usar URL
              </>
            ) : imageMode === 'img2img' ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Generar
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                Generar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function PromptField({
  value,
  onChange,
  placeholder = 'Describí la imagen que querés generar...',
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">Prompt</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
      />
    </div>
  );
}

function ReferenceImagePicker({
  refImageFiles,
  setRefImageFiles,
  refImagePreviews,
  setRefImagePreviews,
  fileInputRef,
  onFileChange,
  onRemoveRefImage,
}: {
  refImageFiles: File[];
  setRefImageFiles: (f: File[]) => void;
  refImagePreviews: string[];
  setRefImagePreviews: (p: string[]) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveRefImage: (i: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">Imágenes de referencia</label>
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors border border-slate-600 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
          {refImageFiles.length > 0
            ? `Agregar más (${refImageFiles.length})`
            : 'Seleccionar imágenes'}
        </button>
        {refImageFiles.length > 0 && (
          <button
            onClick={() => {
              setRefImageFiles([]);
              setRefImagePreviews([]);
            }}
            className="text-slate-500 hover:text-red-400 text-sm transition-colors"
          >
            ✕ Quitar todas
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFileChange}
        />
      </div>
      {refImagePreviews.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {refImagePreviews.map((src, i) => (
            <div key={i} className="relative group/thumb">
              <img
                src={src}
                alt={`Ref ${i + 1}`}
                className="h-20 w-20 object-cover rounded-lg border border-slate-600"
              />
              <button
                onClick={() => onRemoveRefImage(i)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-black/70 text-white rounded-full text-xs hover:bg-red-600 transition-colors flex items-center justify-center opacity-0 group-hover/thumb:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryTagPicker({
  galleryTags,
  selectedGalleryTags,
  setSelectedGalleryTags,
}: {
  galleryTags: string[];
  selectedGalleryTags: string[];
  setSelectedGalleryTags: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">
        Tags de referencia (seleccioná uno o más)
      </label>
      {galleryTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {galleryTags.map((tag) => (
            <button
              key={tag}
              onClick={() =>
                setSelectedGalleryTags((prev) =>
                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                )
              }
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedGalleryTags.includes(tag)
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
          <p className="text-slate-500 text-sm">
            No tenés imágenes en tu galería.{' '}
            <a
              href="/gallery"
              target="_blank"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Subí algunas primero
            </a>
          </p>
        </div>
      )}
      {selectedGalleryTags.length > 0 && (
        <p className="text-xs text-slate-500 mt-2">
          {selectedGalleryTags.length} tag(s) seleccionado(s)
        </p>
      )}
    </div>
  );
}
