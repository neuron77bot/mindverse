import { useState, useRef } from 'react';
import { authHeaders } from '../services/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type ImageMode = 'text' | 'img2img' | 'url';

interface NodePayload {
  nodeId: string;
  nodeContent: string;
  nodeCategory: string;
  nodeTemporalState: string;
  nodeEmotionalLevel: string;
}

export function useImageGeneration() {
  const [imageMode, setImageMode] = useState<ImageMode>('text');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [refImageFiles, setRefImageFiles] = useState<File[]>([]);
  const [refImagePreviews, setRefImagePreviews] = useState<string[]>([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;
    const combined = [...refImageFiles, ...incoming];
    setRefImageFiles(combined);
    const previews = await Promise.all(combined.map(readAsDataURL));
    setRefImagePreviews(previews);
    e.target.value = '';
  };

  const removeRefImage = async (index: number) => {
    const updated = refImageFiles.filter((_, i) => i !== index);
    setRefImageFiles(updated);
    setRefImagePreviews(await Promise.all(updated.map(readAsDataURL)));
  };

  const generateImage = async (nodePayload: NodePayload) => {
    setIsGenerating(true);
    setImageError(null);

    try {
      if (imageMode === 'url') {
        if (!imageUrlInput.trim()) throw new Error('Ingresá una URL de imagen');
        setGeneratedImageUrl(imageUrlInput.trim());
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
            node: nodePayload,
          }),
        });
        if (!res.ok) throw new Error('Error generando imagen');
        const data = await res.json();
        setGeneratedImageUrl(data.images?.[0]?.url ?? null);
      } else {
        // text-to-image
        if (!imagePrompt.trim()) throw new Error('Escribí un prompt');
        const res = await fetch(`${API_BASE}/images/text-to-image`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ prompt: imagePrompt, aspect_ratio: '1:1', node: nodePayload }),
        });
        if (!res.ok) throw new Error('Error generando imagen');
        const data = await res.json();
        setGeneratedImageUrl(data.images?.[0]?.url ?? null);
      }
    } catch (err: any) {
      setImageError(err?.message ?? 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetImageState = () => {
    setImagePrompt('');
    setImageUrlInput('');
    setRefImageFiles([]);
    setRefImagePreviews([]);
    setImageError(null);
    setImageMode('text');
  };

  return {
    imageMode,
    setImageMode,
    imagePrompt,
    setImagePrompt,
    imageUrlInput,
    setImageUrlInput,
    refImageFiles,
    refImagePreviews,
    generatedImageUrl,
    setGeneratedImageUrl,
    isGenerating,
    imageError,
    fileInputRef,
    handleFileChange,
    removeRefImage,
    generateImage,
    resetImageState,
  };
}
