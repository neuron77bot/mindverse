import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authHeaders, authHeadersOnly } from '../../services/authHeaders';
import { compressImages } from '../../utils/imageCompression';

// Lazy load heavy Mermaid component
const MermaidDiagram = lazy(() => import('../UI/MermaidDiagram'));

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';
type InputMode = 'voice' | 'text';
type EditorMode = 'edit' | 'create';

interface StoryboardFrame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
  imageUrl?: string;
  imagePrompt?: string;
}

interface StoryboardEditorProps {
  mode: EditorMode;
}

export default function StoryboardEditor({ mode }: StoryboardEditorProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = mode === 'edit';

  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcription, setTranscription] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [storyboard, setStoryboard] = useState<StoryboardFrame[] | null>(null);
  const [mermaidDiagram, setMermaidDiagram] = useState<string | null>(null);
  const [isGeneratingComic, setIsGeneratingComic] = useState<boolean>(false);
  const [comicPageUrl, setComicPageUrl] = useState<string | null>(null);
  const [frameImages, setFrameImages] = useState<Map<number, string>>(new Map());
  const [generatingFrame, setGeneratingFrame] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [storyboardTitle, setStoryboardTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Estados para generación de imágenes con 4 modos
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [selectedFrameForImage, setSelectedFrameForImage] = useState<StoryboardFrame | null>(null);
  const [imageMode, setImageMode] = useState<'text' | 'img2img' | 'url' | 'gallery'>('text');
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [refImageFiles, setRefImageFiles] = useState<File[]>([]);
  const [refImagePreviews, setRefImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Estados para modo Gallery
  const [galleryTags, setGalleryTags] = useState<string[]>([]);
  const [selectedGalleryTags, setSelectedGalleryTags] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cargar storyboard existente si hay ID
  useEffect(() => {
    if (isEditMode && id) {
      loadStoryboard(id);
    }
  }, [id, isEditMode]);

  const loadStoryboard = async (storyboardId: string) => {
    console.log('📚 Cargando storyboard:', storyboardId);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/storyboards/${storyboardId}`, {
        headers: authHeadersOnly(),
      });

      console.log('📚 Response status:', res.status);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('📚 Error response:', errData);
        throw new Error(errData.error || 'Error cargando storyboard');
      }

      const data = await res.json();
      console.log('📚 Data recibida:', data);
      const sb = data.storyboard;
      console.log('📚 Storyboard:', sb);
      console.log('📚 Frames:', sb?.frames?.length);

      // Poblar los estados con el storyboard cargado
      setStoryboardTitle(sb.title || '');
      setInputMode(sb.inputMode || 'text');
      setTranscription(sb.inputMode === 'voice' ? sb.originalText : '');
      setTextInput(sb.inputMode === 'text' ? sb.originalText : '');
      setStoryboard(sb.frames || []);
      setMermaidDiagram(sb.mermaidDiagram || null);
      setComicPageUrl(sb.comicPageUrl || null);

      console.log('📚 Estados actualizados - frames:', sb.frames?.length);

      // Cargar imágenes de frames si existen
      if (sb.frames) {
        const newFrameImages = new Map<number, string>();
        sb.frames.forEach((frame: StoryboardFrame) => {
          if (frame.imageUrl) {
            newFrameImages.set(frame.frame, frame.imageUrl);
          }
        });
        setFrameImages(newFrameImages);
      }
    } catch (err: any) {
      console.error('❌ Error cargando storyboard:', err);
      setError('Error al cargar el storyboard: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Helpers para generación de imágenes ────────────────────────────────────
  const readAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;
    
    // Comprimir imágenes antes de agregar
    try {
      const compressed = await compressImages(incoming, 2048, 0.85);
      const combined = [...refImageFiles, ...compressed];
      setRefImageFiles(combined);
      const previews = await Promise.all(combined.map(readAsDataURL));
      setRefImagePreviews(previews);
    } catch (err) {
      console.error('Error comprimiendo imágenes:', err);
      setImageError('Error al comprimir imágenes. Intentá con archivos más pequeños.');
    }
    
    e.target.value = '';
  };

  const removeRefImage = async (index: number) => {
    const updated = refImageFiles.filter((_, i) => i !== index);
    setRefImageFiles(updated);
    setRefImagePreviews(await Promise.all(updated.map(readAsDataURL)));
  };

  const openImageModal = async (frame: StoryboardFrame) => {
    setSelectedFrameForImage(frame);
    setIsImageModalOpen(true);
    setImageMode('text');
    setImagePrompt(frame.visualDescription || '');
    setImageUrlInput('');
    setRefImageFiles([]);
    setRefImagePreviews([]);
    setSelectedGalleryTags([]);
    setImageError(null);

    // Cargar tags de la galería
    try {
      const res = await fetch(`${API_BASE}/gallery/tags`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setGalleryTags(data.tags || []);
      }
    } catch (err) {
      console.error('Error cargando tags de galería:', err);
    }
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedFrameForImage(null);
    setImageMode('text');
    setImagePrompt('');
    setImageUrlInput('');
    setRefImageFiles([]);
    setRefImagePreviews([]);
    setSelectedGalleryTags([]);
    setImageError(null);
  };

  const handleGenerateFrameImage = async () => {
    if (!selectedFrameForImage) return;

    setGeneratingFrame(selectedFrameForImage.frame);
    setImageError(null);

    try {
      let imageUrl: string;

      if (imageMode === 'url') {
        if (!imageUrlInput.trim()) throw new Error('Ingresá una URL de imagen');
        imageUrl = imageUrlInput.trim();
      } else if (imageMode === 'gallery') {
        // Modo Gallery: usar tags seleccionados
        if (!imagePrompt.trim()) throw new Error('Escribí un prompt');
        if (selectedGalleryTags.length === 0)
          throw new Error('Seleccioná al menos un tag de la galería');

        const res = await fetch(`${API_BASE}/images/image-to-image`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            prompt: imagePrompt,
            gallery_tags: selectedGalleryTags,
            aspect_ratio: '1:1',
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Error generando imagen');
        }
        const data = await res.json();
        imageUrl = data.images?.[0]?.url ?? null;
        if (!imageUrl) throw new Error('No se recibió URL de imagen');
      } else if (imageMode === 'img2img') {
        if (!imagePrompt.trim()) throw new Error('Escribí un prompt');
        if (refImageFiles.length === 0)
          throw new Error('Seleccioná al menos una imagen de referencia');

        const uploadedUrls = await Promise.all(
          refImageFiles.map(async (file) => {
            const dataUrl = await readAsDataURL(file);
            const uploadRes = await fetch(`${API_BASE}/images/upload`, {
              method: 'POST',
              headers: authHeaders(),
              body: JSON.stringify({ dataUrl }),
            });
            if (!uploadRes.ok) throw new Error(`Error al subir ${file.name}`);
            const { url } = await uploadRes.json();
            return url as string;
          })
        );

        const res = await fetch(`${API_BASE}/images/image-to-image`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            prompt: imagePrompt,
            image_urls: uploadedUrls,
            aspect_ratio: '1:1',
          }),
        });
        if (!res.ok) throw new Error('Error generando imagen');
        const data = await res.json();
        imageUrl = data.images?.[0]?.url ?? null;
        if (!imageUrl) throw new Error('No se recibió URL de imagen');
      } else {
        // text-to-image
        if (!imagePrompt.trim()) throw new Error('Escribí un prompt');
        const res = await fetch(`${API_BASE}/images/text-to-image`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ prompt: imagePrompt, aspect_ratio: '1:1' }),
        });
        if (!res.ok) throw new Error('Error generando imagen');
        const data = await res.json();
        imageUrl = data.images?.[0]?.url ?? null;
        if (!imageUrl) throw new Error('No se recibió URL de imagen');
      }

      // Actualizar el mapa de imágenes
      const newImages = new Map(frameImages);
      newImages.set(selectedFrameForImage.frame, imageUrl);
      setFrameImages(newImages);

      // Cerrar modal
      closeImageModal();
    } catch (err: any) {
      console.error('Error al generar imagen de frame:', err);
      setImageError(err?.message ?? 'Error desconocido');
    } finally {
      setGeneratingFrame(null);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);

      // Verificar soporte para MediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Tu navegador no soporta grabación de audio. Necesitas usar HTTPS o un navegador compatible.'
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      timerRef.current = 0;
      setDuration(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // Enviar audio al backend
        await processRecording();
      };

      mediaRecorder.start();
      setRecordingState('recording');

      // Timer
      intervalRef.current = setInterval(() => {
        timerRef.current += 1;
        setDuration(timerRef.current);
      }, 1000);
    } catch (err: any) {
      console.error('Error al iniciar grabación:', err);
      setError('Error al acceder al micrófono: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecordingState('processing');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      intervalRef.current = setInterval(() => {
        timerRef.current += 1;
        setDuration(timerRef.current);
      }, 1000);
    }
  };

  const processRecording = async () => {
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });

      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');

      const res = await fetch(`${API_BASE}/transcription`, {
        method: 'POST',
        headers: authHeadersOnly(), // Solo Authorization, sin Content-Type
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error en transcripción');
      }

      const data = await res.json();
      setTranscription(data.text || '');
      setRecordingState('idle');
    } catch (err: any) {
      console.error('Error al procesar grabación:', err);
      setError('Error al transcribir: ' + err.message);
      setRecordingState('idle');
    }
  };

  const newRecording = () => {
    setTranscription('');
    setTextInput('');
    setDuration(0);
    setError(null);
    setStoryboard(null);
    setMermaidDiagram(null);
    setComicPageUrl(null);
    setFrameImages(new Map());
    chunksRef.current = [];
    timerRef.current = 0;
  };

  const analyzeWithAI = async () => {
    const textToAnalyze = inputMode === 'voice' ? transcription : textInput;
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/transcription/analyze`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ text: textToAnalyze }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error en análisis');
      }

      const data = await res.json();
      setStoryboard(data.frames || []);
      setMermaidDiagram(data.mermaid || null);
    } catch (err: any) {
      console.error('Error al analizar:', err);
      setError('Error al analizar: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateComicPage = async () => {
    if (!storyboard || storyboard.length === 0) return;

    setIsGeneratingComic(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/transcription/generate-comic-page`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ frames: storyboard }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error generando página de cómic');
      }

      const data = await res.json();
      setComicPageUrl(data.imageUrl);
    } catch (err: any) {
      console.error('Error al generar página de cómic:', err);
      setError('Error al generar página de cómic: ' + err.message);
    } finally {
      setIsGeneratingComic(false);
    }
  };

  // Función generateFrameImage reemplazada por modal de 3 modos

  const saveStoryboard = async () => {
    if (!storyboard || storyboard.length === 0) return;
    if (!storyboardTitle.trim()) {
      setError('Por favor ingresá un título para el storyboard');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Mapear frames con las imágenes generadas
      const framesWithImages = storyboard.map((frame) => ({
        ...frame,
        imageUrl: frameImages.get(frame.frame) || frame.imageUrl || undefined,
      }));

      // En modo edit: PATCH para actualizar
      // En modo create: POST para crear
      const url = isEditMode && id ? `${API_BASE}/storyboards/${id}` : `${API_BASE}/storyboards`;
      const method = isEditMode && id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          title: storyboardTitle,
          originalText: inputMode === 'voice' ? transcription : textInput,
          inputMode,
          frames: framesWithImages,
          mermaidDiagram,
          comicPageUrl,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error guardando storyboard');
      }

      await res.json();

      // En modo edit: volver al detalle
      // En modo create: ir a la lista
      if (isEditMode && id) {
        navigate(`/storyboard/detail/${id}`);
      } else {
        navigate('/storyboards');
      }
    } catch (err: any) {
      console.error('Error al guardar storyboard:', err);
      setError('Error al guardar storyboard: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModeChange = (mode: InputMode) => {
    if (recordingState !== 'idle') return; // No cambiar modo durante grabación
    setInputMode(mode);
    setError(null);
    setStoryboard(null);
    setMermaidDiagram(null);
    setComicPageUrl(null);
    setFrameImages(new Map());
    setStoryboardTitle('');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isSecureContext = window.isSecureContext;
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const hasContent = inputMode === 'voice' ? transcription : textInput;

  // Mostrar loading state
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 text-indigo-500 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
            >
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
            <p className="text-slate-400">Cargando storyboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Header */}
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
            )}
          </div>

          {/* Hero Content */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {isEditMode ? storyboardTitle || 'Editar Storyboard' : 'Crear Storyboard'}
            </h1>

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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Selector de modo: Voice / Text - Solo en modo creación */}
        {!isEditMode && (
          <div className="mb-6 flex gap-2 p-1 bg-slate-800 rounded-lg border border-slate-700">
            <button
              onClick={() => handleModeChange('voice')}
              disabled={recordingState !== 'idle'}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                inputMode === 'voice'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
              Entrada de Voz
            </button>
            <button
              onClick={() => handleModeChange('text')}
              disabled={recordingState !== 'idle'}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                inputMode === 'text'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Entrada de Texto
            </button>
          </div>
        )}

        {/* Advertencia de contexto no seguro (solo en modo voz y modo creación) */}
        {!isEditMode && inputMode === 'voice' && !isSecureContext && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-yellow-400 font-medium text-sm mb-1">
                  Conexión no segura (HTTP)
                </p>
                <p className="text-yellow-300/80 text-xs">
                  La grabación de audio requiere HTTPS. Accedé desde{' '}
                  <code className="bg-black/30 px-1 py-0.5 rounded">https://</code> para habilitar
                  el micrófono.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modo VOZ: Estado de grabación - Solo en modo creación */}
        {!isEditMode && inputMode === 'voice' && (
          <div className="mb-6 p-8 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/50 shadow-2xl">
            {/* Status Bar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-4">
                {/* Status Indicator */}
                <div className="relative">
                  {recordingState === 'recording' && (
                    <>
                      <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-6 h-6 bg-red-500 rounded-full animate-ping opacity-75" />
                    </>
                  )}
                  {recordingState === 'paused' && (
                    <div className="w-6 h-6 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50" />
                  )}
                  {recordingState === 'processing' && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full animate-spin border-2 border-white border-t-transparent" />
                  )}
                  {recordingState === 'idle' && (
                    <div className="w-6 h-6 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
                  )}
                </div>

                <div>
                  <span className="text-white font-semibold text-lg block">
                    {recordingState === 'idle' && '🎤 Listo para grabar'}
                    {recordingState === 'recording' && '🔴 Grabando...'}
                    {recordingState === 'paused' && '⏸️ Pausado'}
                    {recordingState === 'processing' && '⚙️ Procesando audio...'}
                  </span>
                  <span className="text-slate-400 text-sm">
                    {recordingState === 'idle' && 'Presioná el botón rojo para comenzar'}
                    {recordingState === 'recording' && 'La grabación está en curso'}
                    {recordingState === 'paused' && 'Pausado - presioná reanudar para continuar'}
                    {recordingState === 'processing' && 'Transcribiendo tu audio...'}
                  </span>
                </div>
              </div>

              {/* Timer */}
              <div className="text-right">
                <span className="text-white font-mono text-3xl font-bold block">
                  {formatDuration(duration)}
                </span>
                <span className="text-slate-500 text-xs uppercase tracking-wider">Duración</span>
              </div>
            </div>

            {/* Controles */}
            <div className="flex gap-4">
              {recordingState === 'idle' && (
                <>
                  <button
                    onClick={startRecording}
                    disabled={!hasMediaDevices}
                    className="flex-1 py-4 px-8 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/40 hover:scale-105 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {hasMediaDevices ? 'Iniciar Grabación' : 'Micrófono no disponible'}
                  </button>
                  {transcription && (
                    <button
                      onClick={newRecording}
                      className="py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Nueva Grabación
                    </button>
                  )}
                </>
              )}

              {recordingState === 'recording' && (
                <>
                  <button
                    onClick={pauseRecording}
                    className="flex-1 py-4 px-8 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-xl shadow-yellow-500/20 hover:scale-105 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pausar
                  </button>
                  <button
                    onClick={stopRecording}
                    className="flex-1 py-4 px-8 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-500/10 hover:scale-105 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Detener
                  </button>
                </>
              )}

              {recordingState === 'paused' && (
                <>
                  <button
                    onClick={resumeRecording}
                    className="flex-1 py-4 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 hover:scale-105 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Reanudar
                  </button>
                  <button
                    onClick={stopRecording}
                    className="flex-1 py-4 px-8 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-500/10 hover:scale-105 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Detener
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modo TEXTO: Editor de texto - Solo en modo creación */}
        {!isEditMode && inputMode === 'text' && (
          <div className="mb-6 p-8 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
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
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Describe tu historia</h3>
                <p className="text-slate-400 text-sm">
                  Contanos qué querés convertir en storyboard
                </p>
              </div>
            </div>

            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ejemplo: Un perrito juega en el parque, encuentra una pelota y la lleva a su dueño..."
              className="w-full min-h-[240px] p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y transition-all"
              disabled={isAnalyzing}
            />
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {textInput.length} caracteres
                </span>
              </div>
              {textInput.trim() && (
                <button
                  onClick={() => setTextInput('')}
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Transcripción (solo modo voz) */}
        {inputMode === 'voice' && transcription && (
          <div className="mb-6 p-6 bg-slate-800 rounded-xl border border-slate-700">
            <h3 className="text-white font-semibold mb-3">Transcripción:</h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{transcription}</p>
          </div>
        )}

        {/* Botón de generación de storyboard - Solo en modo creación */}
        {!isEditMode && hasContent && !storyboard && (
          <div className="mb-6">
            <button
              onClick={analyzeWithAI}
              disabled={isAnalyzing}
              className="w-full py-3 px-6 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600"
            >
              {isAnalyzing ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
                  Generando storyboard...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Generar Storyboard (6-8 viñetas)
                </>
              )}
            </button>
          </div>
        )}

        {/* Storyboard generado */}
        {storyboard && storyboard.length > 0 && (
          <div className="mb-6 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-slate-700">
            {/* Historia original */}
            <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <h4 className="text-slate-400 text-sm font-medium mb-2">
                {inputMode === 'voice' ? '🎙️ Historia original:' : '📝 Historia original:'}
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {inputMode === 'voice' ? transcription : textInput}
              </p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Storyboard ({storyboard.length} viñetas)
              </h3>
              {!isEditMode && (
                <button
                  onClick={() => {
                    setStoryboard(null);
                    setMermaidDiagram(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Cerrar storyboard"
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
              )}
            </div>

            {/* Grid de viñetas del storyboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {storyboard.map((frame) => (
                <div
                  key={frame.frame}
                  className="group bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                >
                  {/* Header de la viñeta */}
                  <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-4 py-3 border-b border-slate-700/50 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      #{frame.frame}
                    </div>
                    <h4 className="text-white font-semibold flex-1 group-hover:text-indigo-300 transition-colors">
                      {frame.scene}
                    </h4>
                  </div>

                  {/* Contenido de la viñeta */}
                  <div className="p-4 space-y-3">
                    {/* Descripción visual */}
                    <div>
                      <h5 className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wide">
                        Descripción Visual
                      </h5>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {frame.visualDescription}
                      </p>
                    </div>

                    {/* Diálogo (si existe) */}
                    {frame.dialogue && (
                      <div className="pt-2 border-t border-slate-700/50">
                        <h5 className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wide">
                          Diálogo
                        </h5>
                        <p className="text-slate-200 text-sm italic">"{frame.dialogue}"</p>
                      </div>
                    )}

                    {/* Imagen generada o botón para generar */}
                    {frameImages.has(frame.frame) ? (
                      <>
                        <div
                          className="relative aspect-video bg-slate-900/50 rounded border-2 border-slate-700 overflow-hidden cursor-pointer group"
                          onClick={() =>
                            setLightboxImage({
                              url: frameImages.get(frame.frame)!,
                              title: `Frame #${frame.frame}: ${frame.scene}`,
                            })
                          }
                        >
                          <img
                            src={frameImages.get(frame.frame)}
                            alt={`Viñeta ${frame.frame}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Hover overlay indicator - Solo visible en hover */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <svg
                              className="w-12 h-12 text-white drop-shadow-lg"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                              />
                            </svg>
                          </div>
                        </div>
                        {/* Botón regenerar debajo de la imagen */}
                        {isEditMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openImageModal(frame);
                            }}
                            disabled={generatingFrame === frame.frame}
                            className="mt-3 w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
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
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Regenerar Imagen
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="aspect-video bg-slate-900/50 rounded border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                        // Botón para generar imagen
                        <button
                          onClick={() => openImageModal(frame)}
                          disabled={generatingFrame === frame.frame}
                          className="w-full h-full flex flex-col items-center justify-center hover:bg-slate-800/50 transition-colors disabled:opacity-70"
                        >
                          {generatingFrame === frame.frame ? (
                            <>
                              <svg
                                className="w-10 h-10 text-slate-500 mb-2 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
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
                              <p className="text-slate-500 text-xs">Generando...</p>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-10 h-10 text-slate-500 mb-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <p className="text-slate-400 text-xs font-medium">Generar Imagen</p>
                              <p className="text-slate-600 text-xs mt-1">Click para crear</p>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botón para generar página de cómic */}
            {!comicPageUrl && (
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
                      <span className="text-lg">🎨 Generar Página de Cómic Completa</span>
                    </>
                  )}
                </button>
                <p className="text-center text-slate-500 text-xs mt-2">
                  Genera una imagen única con todas las {storyboard?.length} viñetas en formato
                  página de cómic B&N
                </p>
              </div>
            )}

            {/* Imagen de página de cómic generada */}
            {comicPageUrl && (
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
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                  <img
                    src={comicPageUrl}
                    alt="Página de cómic generada"
                    className="w-full h-auto"
                  />
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
            )}

            {/* Timeline Mermaid */}
            {mermaidDiagram && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Timeline de la historia
                </h4>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center py-12">
                        <div className="icon-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                      </div>
                    }
                  >
                    <MermaidDiagram chart={mermaidDiagram} />
                  </Suspense>
                </div>
              </div>
            )}

            {/* Guardar Storyboard - Solo en modo creación */}
            {!isEditMode && (
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30">
                <h4 className="text-white font-medium mb-3">Guardar Storyboard</h4>
                <input
                  type="text"
                  value={storyboardTitle}
                  onChange={(e) => setStoryboardTitle(e.target.value)}
                  placeholder="Título del storyboard..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                <button
                  onClick={saveStoryboard}
                  disabled={isSaving || !storyboardTitle.trim()}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                        />
                      </svg>
                      Guardar Storyboard
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Botón volver a analizar - Solo en modo creación */}
            {!isEditMode && (
              <button
                onClick={analyzeWithAI}
                disabled={isAnalyzing}
                className="mt-4 w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Volver a analizar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de generación de imágenes con 3 modos */}
      {isImageModalOpen && selectedFrameForImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-2xl w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Generar Imagen - Frame #{selectedFrameForImage.frame}
                </h3>
                <p className="text-slate-400 text-sm mt-1">{selectedFrameForImage.scene}</p>
              </div>
              <button
                onClick={closeImageModal}
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

            {/* Selector de modo */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {(
                [
                  { key: 'text', label: 'Text to Image', icon: '✨' },
                  { key: 'img2img', label: 'Image to Image', icon: '🖼️' },
                  { key: 'gallery', label: 'Gallery Reference', icon: '📸' },
                  { key: 'url', label: 'URL', icon: '🔗' },
                ] as { key: typeof imageMode; label: string; icon: string }[]
              ).map((m) => (
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

            {/* Contenido según modo */}
            <div className="space-y-4 mb-6">
              {/* Modo: Text to Image */}
              {imageMode === 'text' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Prompt</label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describí la imagen que querés generar..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
                  />
                </div>
              )}

              {/* Modo: Image to Image */}
              {imageMode === 'img2img' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Prompt</label>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describí qué querés generar a partir de la referencia..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Imágenes de referencia
                    </label>
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors border border-slate-600 flex items-center gap-2"
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
                        onChange={handleFileChange}
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
                              onClick={() => removeRefImage(i)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-black/70 text-white rounded-full text-xs hover:bg-red-600 transition-colors flex items-center justify-center opacity-0 group-hover/thumb:opacity-100"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Modo: URL */}
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

              {/* Modo: Gallery Reference */}
              {imageMode === 'gallery' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Prompt</label>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describí qué querés generar con las imágenes de referencia..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Tags de referencia (seleccioná uno o más)
                    </label>
                    {galleryTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {galleryTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setSelectedGalleryTags((prev) =>
                                prev.includes(tag)
                                  ? prev.filter((t) => t !== tag)
                                  : [...prev, tag]
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
                </>
              )}

              {/* Error */}
              {imageError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {imageError}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeImageModal}
                className="flex-1 py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateFrameImage}
                disabled={generatingFrame === selectedFrameForImage.frame}
                className="flex-1 py-3 px-6 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/20"
              >
                {generatingFrame === selectedFrameForImage.frame ? (
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
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-7xl w-full h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-4 shrink-0">
              <h3 className="text-white font-semibold text-lg">{lightboxImage.title}</h3>
              <button
                onClick={() => setLightboxImage(null)}
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

            {/* Image Container */}
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

            {/* Download button */}
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
      )}
    </div>
  );
}
