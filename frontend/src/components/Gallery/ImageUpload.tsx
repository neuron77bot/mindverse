import { useState, useRef } from 'react';
import { authHeaders } from '../../services/authHeaders';
import { compressImages } from '../../utils/imageCompression';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface ImageUploadProps {
  onUploadSuccess: () => void;
}

export default function ImageUpload({ onUploadSuccess }: ImageUploadProps) {
  const [tag, setTag] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (incoming: File[]) => {
    if (!incoming.length) return;

    try {
      const compressed = await compressImages(incoming, 2048, 0.85);
      const combined = [...files, ...compressed];
      setFiles(combined);
      const newPreviews = await Promise.all(combined.map(readAsDataURL));
      setPreviews(newPreviews);
      setError(null);
    } catch (err) {
      console.error('Error comprimiendo imágenes:', err);
      setError('Error al comprimir imágenes');
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    await handleFileChange(incoming);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const incoming = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    await handleFileChange(incoming);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!tag.trim()) {
      setError('Ingresá un tag para las imágenes');
      return;
    }

    if (files.length === 0) {
      setError('Seleccioná al menos una imagen');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Subir todas las imágenes con el mismo tag
      await Promise.all(
        files.map(async (file, index) => {
          const dataUrl = await readAsDataURL(file);
          const res = await fetch(`${API_BASE}/gallery/upload`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              dataUrl,
              tag: tag.startsWith('@') ? tag : `@${tag}`,
              filename: file.name,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Error subiendo imagen ${index + 1}`);
          }
        })
      );

      // Limpiar y notificar éxito
      setTag('');
      setFiles([]);
      setPreviews([]);
      onUploadSuccess();
    } catch (err: any) {
      console.error('Error al subir imágenes:', err);
      setError(err?.message || 'Error al subir imágenes');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Subir Imágenes
      </h3>

      {/* Tag Input */}
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-2">
          Tag de referencia *
        </label>
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Ej: @personaje-principal"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          disabled={isUploading}
        />
        <p className="text-xs text-slate-500 mt-1">
          Todas las imágenes compartirán este tag
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-600 hover:border-slate-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <svg
          className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-indigo-400' : 'text-slate-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>

        <p className="text-slate-400 mb-2">
          {isDragging ? '¡Soltá las imágenes aquí!' : 'Arrastrá imágenes aquí'}
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors disabled:opacity-50"
        >
          o hacé click para seleccionar
        </button>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-slate-400 mb-3">{previews.length} imagen(es) seleccionada(s)</p>
          <div className="grid grid-cols-4 gap-3">
            {previews.map((src, i) => (
              <div key={i} className="relative group">
                <img
                  src={src}
                  alt={`Preview ${i + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-slate-600"
                />
                <button
                  onClick={() => removeFile(i)}
                  disabled={isUploading}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={isUploading || !tag.trim() || files.length === 0}
        className="mt-4 w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Subiendo...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Subir a Galería
          </>
        )}
      </button>
    </div>
  );
}
