import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authHeaders, authHeadersOnly } from '../../../services/authHeaders';
import { compressImages } from '../../../utils/imageCompression';
import type {
  RecordingState,
  InputMode,
  EditorMode,
  StoryboardFrame,
  ImageMode,
  LightboxImage,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

const readAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

export function useStoryboardEditor(mode: EditorMode) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = mode === 'edit';

  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcription, setTranscription] = useState('');
  const [textInput, setTextInput] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [storyboard, setStoryboard] = useState<StoryboardFrame[] | null>(null);
  const [mermaidDiagram, setMermaidDiagram] = useState<string | null>(null);
  const [frameImages, setFrameImages] = useState<Map<number, string>>(new Map());
  const [generatingFrame, setGeneratingFrame] = useState<number | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [storyboardTitle, setStoryboardTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Image modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedFrameForImage, setSelectedFrameForImage] = useState<StoryboardFrame | null>(null);
  const [imageMode, setImageMode] = useState<ImageMode>('text');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [refImageFiles, setRefImageFiles] = useState<File[]>([]);
  const [refImagePreviews, setRefImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null);

  // Gallery state
  const [galleryTags, setGalleryTags] = useState<string[]>([]);
  const [selectedGalleryTags, setSelectedGalleryTags] = useState<string[]>([]);

  // Style tags state
  const [availableStyleTags, setAvailableStyleTags] = useState<any[]>([]);
  const [selectedStyleTagIds, setSelectedStyleTagIds] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditMode && id) {
      loadStoryboard(id);
    }
  }, [id, isEditMode]);

  // ── API calls ──────────────────────────────────────────────────────────

  const loadStoryboard = async (storyboardId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/storyboards/${storyboardId}`, {
        headers: authHeadersOnly(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error cargando storyboard');
      }
      const data = await res.json();
      const sb = data.storyboard;

      setStoryboardTitle(sb.title || '');
      setInputMode(sb.inputMode || 'text');
      setTranscription(sb.inputMode === 'voice' ? sb.originalText : '');
      setTextInput(sb.inputMode === 'text' ? sb.originalText : '');
      setStoryboard(sb.frames || []);
      setMermaidDiagram(sb.mermaidDiagram || null);

      if (sb.frames) {
        const newFrameImages = new Map<number, string>();
        sb.frames.forEach((frame: StoryboardFrame) => {
          if (frame.imageUrl) newFrameImages.set(frame.frame, frame.imageUrl);
        });
        setFrameImages(newFrameImages);
      }
    } catch (err: any) {
      setError('Error al cargar el storyboard: ' + err.message);
    } finally {
      setIsLoading(false);
    }
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
      setError('Error al analizar: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveStoryboard = async () => {
    if (!storyboard || storyboard.length === 0) return;
    if (!storyboardTitle.trim()) {
      setError('Por favor ingresá un título para el storyboard');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const framesWithImages = storyboard.map((frame) => ({
        ...frame,
        imageUrl: frameImages.get(frame.frame) || frame.imageUrl || undefined,
      }));

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
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error guardando storyboard');
      }
      await res.json();

      if (isEditMode && id) {
        navigate(`/storyboard/detail/${id}`);
      } else {
        navigate('/storyboards');
      }
    } catch (err: any) {
      setError('Error al guardar storyboard: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Recording ──────────────────────────────────────────────────────────

  const processRecording = async () => {
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');

      const res = await fetch(`${API_BASE}/transcription`, {
        method: 'POST',
        headers: authHeadersOnly(),
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
      setError('Error al transcribir: ' + err.message);
      setRecordingState('idle');
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Tu navegador no soporta grabación de audio. Necesitas usar HTTPS o un navegador compatible.'
        );
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      timerRef.current = 0;
      setDuration(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        await processRecording();
      };

      mediaRecorder.start();
      setRecordingState('recording');
      intervalRef.current = setInterval(() => {
        timerRef.current += 1;
        setDuration(timerRef.current);
      }, 1000);
    } catch (err: any) {
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

  const newRecording = () => {
    setTranscription('');
    setTextInput('');
    setDuration(0);
    setError(null);
    setStoryboard(null);
    setMermaidDiagram(null);
    setFrameImages(new Map());
    chunksRef.current = [];
    timerRef.current = 0;
  };

  // ── Image modal ────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;
    try {
      const compressed = await compressImages(incoming, 2048, 0.85);
      const combined = [...refImageFiles, ...compressed];
      setRefImageFiles(combined);
      const previews = await Promise.all(combined.map(readAsDataURL));
      setRefImagePreviews(previews);
    } catch {
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
    setSelectedStyleTagIds([]);
    setImageError(null);

    try {
      const res = await fetch(`${API_BASE}/gallery/tags`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGalleryTags(data.tags || []);
      }
    } catch {
      // gallery tags are optional
    }

    try {
      const res = await fetch(`${API_BASE}/prompt-styles`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAvailableStyleTags(data.tags || []);
      }
    } catch {
      // style tags are optional
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
    setSelectedStyleTagIds([]);
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
        if (!imagePrompt.trim()) throw new Error('Escribí un prompt');
        if (selectedGalleryTags.length === 0)
          throw new Error('Seleccioná al menos un tag de la galería');
        const res = await fetch(`${API_BASE}/images/image-to-image`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            prompt: imagePrompt,
            gallery_tags: selectedGalleryTags,
            styleTagIds: selectedStyleTagIds,
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
            styleTagIds: selectedStyleTagIds,
            aspect_ratio: '1:1',
          }),
        });
        if (!res.ok) throw new Error('Error generando imagen');
        const data = await res.json();
        imageUrl = data.images?.[0]?.url ?? null;
        if (!imageUrl) throw new Error('No se recibió URL de imagen');
      } else {
        if (!imagePrompt.trim()) throw new Error('Escribí un prompt');
        const res = await fetch(`${API_BASE}/images/text-to-image`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            prompt: imagePrompt,
            styleTagIds: selectedStyleTagIds,
            aspect_ratio: '1:1',
          }),
        });
        if (!res.ok) throw new Error('Error generando imagen');
        const data = await res.json();
        imageUrl = data.images?.[0]?.url ?? null;
        if (!imageUrl) throw new Error('No se recibió URL de imagen');
      }

      const newImages = new Map(frameImages);
      newImages.set(selectedFrameForImage.frame, imageUrl);
      setFrameImages(newImages);
      closeImageModal();
    } catch (err: any) {
      setImageError(err?.message ?? 'Error desconocido');
    } finally {
      setGeneratingFrame(null);
    }
  };

  const handleBatchGenerate = async (galleryTags: string[], styleTagIds: string[]) => {
    if (!storyboard || storyboard.length === 0) return;
    if (galleryTags.length === 0 && styleTagIds.length === 0) return;

    setIsBatchGenerating(true);
    setError(null);

    try {
      for (const frame of storyboard) {
        setGeneratingFrame(frame.frame);

        let imageUrl: string;
        const prompt = frame.visualDescription || `Frame ${frame.frame}: ${frame.scene}`;

        if (galleryTags.length > 0) {
          // Image-to-image con gallery tags
          const res = await fetch(`${API_BASE}/images/image-to-image`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              prompt,
              gallery_tags: galleryTags,
              styleTagIds,
              aspect_ratio: '1:1',
            }),
          });
          if (!res.ok) throw new Error(`Error generando frame ${frame.frame}`);
          const data = await res.json();
          imageUrl = data.images?.[0]?.url ?? null;
        } else {
          // Text-to-image solo con style tags
          const res = await fetch(`${API_BASE}/images/text-to-image`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              prompt,
              styleTagIds,
              aspect_ratio: '1:1',
            }),
          });
          if (!res.ok) throw new Error(`Error generando frame ${frame.frame}`);
          const data = await res.json();
          imageUrl = data.images?.[0]?.url ?? null;
        }

        if (!imageUrl) throw new Error(`No se recibió URL para frame ${frame.frame}`);

        setFrameImages((prev) => {
          const newMap = new Map(prev);
          newMap.set(frame.frame, imageUrl);
          return newMap;
        });
      }
    } catch (err: any) {
      setError(`Error en generación masiva: ${err.message}`);
    } finally {
      setIsBatchGenerating(false);
      setGeneratingFrame(null);
    }
  };

  // ── Misc ───────────────────────────────────────────────────────────────

  const handleModeChange = (newMode: InputMode) => {
    if (recordingState !== 'idle') return;
    setInputMode(newMode);
    setError(null);
    setStoryboard(null);
    setMermaidDiagram(null);
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

  return {
    navigate,
    id,
    isEditMode,

    inputMode,
    recordingState,
    transcription,
    textInput,
    setTextInput,
    duration,
    error,
    isAnalyzing,
    storyboard,
    setStoryboard,
    mermaidDiagram,
    setMermaidDiagram,
    frameImages,
    generatingFrame,
    isBatchGenerating,
    isSaving,
    storyboardTitle,
    setStoryboardTitle,
    isLoading,

    isImageModalOpen,
    selectedFrameForImage,
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
    lightboxImage,
    setLightboxImage,

    galleryTags,
    selectedGalleryTags,
    setSelectedGalleryTags,

    availableStyleTags,
    selectedStyleTagIds,
    setSelectedStyleTagIds,

    fileInputRef,

    isSecureContext,
    hasMediaDevices,
    hasContent,
    formatDuration,

    handleModeChange,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    newRecording,
    analyzeWithAI,
    saveStoryboard,

    openImageModal,
    closeImageModal,
    handleGenerateFrameImage,
    handleBatchGenerate,
    handleFileChange,
    removeRefImage,
  };
}

export type StoryboardEditorHook = ReturnType<typeof useStoryboardEditor>;
