import type { StoryboardFrame, ImageMode } from './types';
import GalleryTagPicker from '../../shared/GalleryTagPicker';
import FrameReferenceSelector from './FrameReferenceSelector';

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
  storyboardFrames: StoryboardFrame[];
  selectedFrameRef: number | null;
  setSelectedFrameRef: React.Dispatch<React.SetStateAction<number | null>>;
  availableStyleTags: any[];
  selectedStyleTagIds: string[];
  setSelectedStyleTagIds: React.Dispatch<React.SetStateAction<string[]>>;
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
  { key: 'frame', label: 'Frame Reference', icon: '📷' },
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
  storyboardFrames,
  selectedFrameRef,
  setSelectedFrameRef,
  availableStyleTags,
  selectedStyleTagIds,
  setSelectedStyleTagIds,
  fileInputRef,
  onClose,
  onGenerate,
  onFileChange,
  onRemoveRefImage,
}: ImageGenerationModalProps) {
  const isGenerating = generatingFrame === selectedFrame.frame;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
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
        <div className="px-6 pb-4 flex-shrink-0 border-b border-slate-800">
          <label className="block text-sm text-slate-400 mb-2">Modo de generación</label>
          <select
            value={imageMode}
            onChange={(e) => {
              setImageMode(e.target.value as ImageMode);
              setImageError(null);
            }}
            className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all appearance-none cursor-pointer hover:bg-slate-750"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a1a1aa'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.25rem',
              backgroundRepeat: 'no-repeat',
              paddingRight: '2.5rem',
            }}
          >
            {MODE_OPTIONS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.icon} {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mode content - Scrollable */}
        <div className="space-y-4 px-6 py-4 overflow-y-auto flex-1">
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

          {imageMode === 'frame' && (
            <>
              <PromptField
                value={imagePrompt}
                onChange={setImagePrompt}
                placeholder="Describí qué querés generar usando el frame como referencia..."
                rows={3}
              />
              <FrameReferenceSelector
                frames={storyboardFrames}
                currentFrameNumber={selectedFrame.frame}
                selectedFrameNumber={selectedFrameRef}
                onSelectFrame={setSelectedFrameRef}
              />
            </>
          )}

          {/* Style Tags - Available in all modes */}
          <StyleTagPicker
            availableStyleTags={availableStyleTags}
            selectedStyleTagIds={selectedStyleTagIds}
            setSelectedStyleTagIds={setSelectedStyleTagIds}
          />

          {imageError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {imageError}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 flex-shrink-0 border-t border-slate-800 bg-slate-900/50">
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

// GalleryTagPicker moved to shared/GalleryTagPicker.tsx

function StyleTagPicker({
  availableStyleTags,
  selectedStyleTagIds,
  setSelectedStyleTagIds,
}: {
  availableStyleTags: any[];
  selectedStyleTagIds: string[];
  setSelectedStyleTagIds: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  if (availableStyleTags.length === 0) return null;

  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">Estilos de Prompt (opcional)</label>
      <div className="flex flex-wrap gap-2">
        {availableStyleTags.map((tag) => (
          <button
            key={tag._id}
            onClick={() =>
              setSelectedStyleTagIds((prev) =>
                prev.includes(tag._id) ? prev.filter((id) => id !== tag._id) : [...prev, tag._id]
              )
            }
            className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
              selectedStyleTagIds.includes(tag._id)
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
            title={tag.description || tag.promptText}
          >
            🎨 {tag.name}
          </button>
        ))}
      </div>
      {selectedStyleTagIds.length > 0 && (
        <p className="text-xs text-slate-500 mt-2">
          {selectedStyleTagIds.length} estilo(s) seleccionado(s)
        </p>
      )}
    </div>
  );
}
