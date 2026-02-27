interface GalleryTagPickerProps {
  galleryTags: string[];
  selectedGalleryTags: string[];
  setSelectedGalleryTags: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function GalleryTagPicker({
  galleryTags,
  selectedGalleryTags,
  setSelectedGalleryTags,
}: GalleryTagPickerProps) {
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
              onClick={(e) => {
                e.stopPropagation();
                setSelectedGalleryTags((prev) =>
                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                );
              }}
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
