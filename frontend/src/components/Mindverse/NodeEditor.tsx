import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { authHeaders } from '../../services/authHeaders';
import { useMindverseStore } from '../../store/mindverseStore';
import type { Category, TemporalState, EmotionalLevel, MindverseNode } from '../../types';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  TEMPORAL_LABELS,
  HAWKINS_SCALE,
  EMOTIONAL_COLORS,
  ROOT_NODE_ID,
} from '../../data/mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

const categories: Category[] = [
  'HEALTH', 'WORK', 'LOVE', 'FAMILY', 'FINANCES',
  'PERSONAL_GROWTH', 'LEISURE', 'SPIRITUALITY', 'SOCIAL',
];
const temporalStates: TemporalState[] = ['PAST', 'PRESENT', 'FUTURE'];

export default function NodeEditor() {
  const {
    isEditorOpen, selectedNode, nodes, connections, closeEditor,
    addNode, updateNode, deleteNode, addConnection, deleteConnection,
    activeTemporalFilter,
  } = useMindverseStore();

  const [content, setContent]             = useState('');
  const [description, setDescription]     = useState('');
  const [category, setCategory]           = useState<Category>('HEALTH');
  const [temporalState, setTemporalState] = useState<TemporalState>('PRESENT');
  const [emotionalLevel, setEmotionalLevel] = useState<EmotionalLevel>('NEUTRALITY');
  const [inNodeIds, setInNodeIds]         = useState<string[]>([]);
  const [outNodeIds, setOutNodeIds]       = useState<string[]>([]);
  const [tags, setTags]                   = useState<string[]>([]);
  const [tagInput, setTagInput]           = useState('');
  const [isFavorite, setIsFavorite]       = useState(false);

  // ── Imagen ────────────────────────────────────────────────────────────────
  const [imageMode, setImageMode] = useState<'text' | 'img2img' | 'url'>('text');
  const [imagePrompt, setImagePrompt]       = useState('');
  const [imageUrlInput, setImageUrlInput]   = useState('');
  const [refImageFiles, setRefImageFiles]   = useState<File[]>([]);
  const [refImagePreviews, setRefImagePreviews] = useState<string[]>([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating]     = useState(false);
  const [imageError, setImageError]         = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'general' | 'vibracion' | 'imagen'>('general');

  const isRootNode  = selectedNode?.id === ROOT_NODE_ID;
  const otherNodes  = nodes.filter((n) => n.id !== selectedNode?.id);

  useEffect(() => {
    if (selectedNode) {
      setContent(selectedNode.content);
      setDescription(selectedNode.description || '');
      setCategory(selectedNode.category);
      setTemporalState(selectedNode.temporalState);
      setEmotionalLevel(selectedNode.emotionalLevel || 'NEUTRALITY');
      const inConns  = connections.filter((c) => c.target === selectedNode.id).map((c) => c.source);
      const outConns = connections.filter((c) => c.source === selectedNode.id).map((c) => c.target);
      setInNodeIds(inConns);
      setOutNodeIds(outConns);
      setGeneratedImageUrl(selectedNode.imageUrl || null);
      setTags(selectedNode.tags || []);
      setIsFavorite(selectedNode.isFavorite || false);
    } else {
      setContent(''); setDescription('');
      setCategory('HEALTH');
      setTemporalState(activeTemporalFilter === 'ALL' ? 'PRESENT' : activeTemporalFilter);
      setEmotionalLevel('NEUTRALITY');
      setInNodeIds([]);
      setOutNodeIds([]);
      setGeneratedImageUrl(null);
      setTags([]);
      setIsFavorite(false);
    }
    setTagInput('');
    setImagePrompt('');
    setImageUrlInput('');
    setRefImageFiles([]);
    setRefImagePreviews([]);
    setImageError(null);
    setImageMode('text');
    setActiveTab('general');
  }, [selectedNode, activeTemporalFilter, connections]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const readAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  // ── Handlers de imagen ────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;
    // Acumular a los archivos ya seleccionados
    const combined = [...refImageFiles, ...incoming];
    setRefImageFiles(combined);
    const previews = await Promise.all(combined.map(readAsDataURL));
    setRefImagePreviews(previews);
    // Limpiar input para permitir re-selección
    e.target.value = '';
  };

  const removeRefImage = async (index: number) => {
    const updated = refImageFiles.filter((_, i) => i !== index);
    setRefImageFiles(updated);
    setRefImagePreviews(await Promise.all(updated.map(readAsDataURL)));
  };

  const buildNodePayload = () => {
    const nodeId = selectedNode?.id ?? `pending-${Date.now()}`;
    return {
      nodeId,
      nodeContent:        content,
      nodeCategory:       category,
      nodeTemporalState:  temporalState,
      nodeEmotionalLevel: emotionalLevel,
    };
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setImageError(null);
    const node = buildNodePayload();

    try {
      if (imageMode === 'url') {
        if (!imageUrlInput.trim()) throw new Error('Ingresá una URL de imagen');
        setGeneratedImageUrl(imageUrlInput.trim());

      } else if (imageMode === 'img2img') {
        if (!imagePrompt.trim()) throw new Error('Escribí un prompt');
        if (refImageFiles.length === 0) throw new Error('Seleccioná al menos una imagen de referencia');

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
          body: JSON.stringify({ prompt: imagePrompt, image_urls: uploadedUrls, aspect_ratio: '1:1', node }),
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
          body: JSON.stringify({ prompt: imagePrompt, aspect_ratio: '1:1', node }),
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

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!content.trim()) return;

    if (selectedNode) {
      updateNode(selectedNode.id, {
        content, description, category, temporalState, emotionalLevel,
        color: isRootNode ? '#FBBF24' : CATEGORY_COLORS[category],
        ...(generatedImageUrl !== null ? { imageUrl: generatedImageUrl } : {}),
        tags,
        isFavorite,
      });

      if (!isRootNode) {
        // Solo actualizar conexiones si cambiaron
        const currentInIds = connections.filter((c) => c.target === selectedNode.id).map((c) => c.source);
        const currentOutIds = connections.filter((c) => c.source === selectedNode.id).map((c) => c.target);
        
        const inChanged = JSON.stringify([...inNodeIds].sort()) !== JSON.stringify([...currentInIds].sort());
        const outChanged = JSON.stringify([...outNodeIds].sort()) !== JSON.stringify([...currentOutIds].sort());

        if (inChanged) {
          // Eliminar todas las conexiones IN viejas
          const oldInConns = connections.filter((c) => c.target === selectedNode.id);
          oldInConns.forEach((c) => deleteConnection(c.id));
          // Crear las nuevas conexiones IN
          inNodeIds.forEach((srcId) => {
            addConnection({ id: uuidv4(), source: srcId, target: selectedNode.id });
          });
        }

        if (outChanged) {
          // Eliminar todas las conexiones OUT viejas
          const oldOutConns = connections.filter((c) => c.source === selectedNode.id);
          oldOutConns.forEach((c) => deleteConnection(c.id));
          // Crear las nuevas conexiones OUT
          outNodeIds.forEach((tgtId) => {
            addConnection({ id: uuidv4(), source: selectedNode.id, target: tgtId });
          });
        }
      }
    } else {
      const newNode: MindverseNode = {
        id: uuidv4(), content, description, category, temporalState, emotionalLevel,
        positionX: Math.random() * 400 + 100,
        positionY: Math.random() * 300 + 100,
        color: CATEGORY_COLORS[category],
        createdAt: new Date(),
        ...(generatedImageUrl ? { imageUrl: generatedImageUrl } : {}),
        tags,
        isFavorite,
      };
      addNode(newNode);
      // Crear conexiones IN
      inNodeIds.forEach((srcId) => {
        addConnection({ id: uuidv4(), source: srcId, target: newNode.id });
      });
      // Crear conexiones OUT
      outNodeIds.forEach((tgtId) => {
        addConnection({ id: uuidv4(), source: newNode.id, target: tgtId });
      });
    }
    closeEditor();
  };

  const handleDelete = () => {
    if (selectedNode && !isRootNode) { deleteNode(selectedNode.id); closeEditor(); }
  };

  if (!isEditorOpen) return null;

  const selectClass = "w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md lg:max-w-2xl mx-4 overflow-hidden border border-slate-700 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 shrink-0">
          <h2 className="text-xl font-bold text-white">
            {selectedNode ? (isRootNode ? 'Casco Periférico' : 'Editar Pensamiento') : 'Nuevo Pensamiento'}
          </h2>
        </div>

        {/* Tabs */}
        {!isRootNode && (
          <div className="flex border-b border-slate-700 shrink-0 px-6">
            {([
              { key: 'general',   label: 'General',   icon: '✏️' },
              { key: 'vibracion', label: 'Vibración',  icon: '⚡' },
              { key: 'imagen',    label: 'Imagen',     icon: '🎨' },
            ] as { key: typeof activeTab; label: string; icon: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <div className="p-6 overflow-y-auto">
        <div className="space-y-4">

          {/* ── Tab General ─────────────────────────────────────────────────── */}
          {(activeTab === 'general' || isRootNode) && (<>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Pensamiento *</label>
              <input
                type="text" value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="¿Qué pensamiento querés registrar?"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                disabled={isRootNode}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Añade más contexto..." rows={4}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* IN / OUT */}
            {!isRootNode && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* IN connections */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">→ IN (Padres)</label>
                  {inNodeIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {inNodeIds.map((nodeId) => {
                        const node = nodes.find((n) => n.id === nodeId);
                        return (
                          <span
                            key={nodeId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs rounded-md"
                          >
                            {node?.content || nodeId}
                            <button
                              type="button"
                              onClick={() => setInNodeIds(inNodeIds.filter((id) => id !== nodeId))}
                              className="hover:text-red-400 transition-colors"
                            >✕</button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !inNodeIds.includes(val)) setInNodeIds([...inNodeIds, val]);
                    }}
                    className={selectClass}
                  >
                    <option value="">+ Agregar padre</option>
                    {otherNodes
                      .filter((n) => !inNodeIds.includes(n.id))
                      .map((n) => <option key={n.id} value={n.id}>{n.content}</option>)}
                  </select>
                </div>

                {/* OUT connections */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">→ OUT (Hijos)</label>
                  {outNodeIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {outNodeIds.map((nodeId) => {
                        const node = nodes.find((n) => n.id === nodeId);
                        return (
                          <span
                            key={nodeId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs rounded-md"
                          >
                            {node?.content || nodeId}
                            <button
                              type="button"
                              onClick={() => setOutNodeIds(outNodeIds.filter((id) => id !== nodeId))}
                              className="hover:text-red-400 transition-colors"
                            >✕</button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !outNodeIds.includes(val)) setOutNodeIds([...outNodeIds, val]);
                    }}
                    className={selectClass}
                  >
                    <option value="">+ Agregar hijo</option>
                    {otherNodes
                      .filter((n) => !outNodeIds.includes(n.id))
                      .map((n) => <option key={n.id} value={n.id}>{n.content}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Tags */}
            {!isRootNode && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Etiquetas</label>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-full"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                          className="hover:text-red-400 transition-colors"
                        >✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        const normalized = tagInput.trim().toLowerCase();
                        if (!tags.includes(normalized)) setTags([...tags, normalized]);
                        setTagInput('');
                      }
                    }}
                    placeholder="Escribí y presioná Enter"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const normalized = tagInput.trim().toLowerCase();
                      if (normalized && !tags.includes(normalized)) {
                        setTags([...tags, normalized]);
                        setTagInput('');
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!tagInput.trim()}
                  >+ Agregar</button>
                </div>
              </div>
            )}

            {/* Favorito */}
            {!isRootNode && (
              <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-700 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⭐</span>
                  <div>
                    <p className="text-sm font-medium text-slate-300">Marcar como favorito</p>
                    <p className="text-xs text-slate-500">Destacar este pensamiento</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isFavorite ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      isFavorite ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}
          </>)}

          {/* ── Tab Vibración ────────────────────────────────────────────────── */}
          {activeTab === 'vibracion' && !isRootNode && (<>

            {/* Temporal State */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Línea Temporal</label>
              <div className="flex gap-2">
                {temporalStates.map((state) => (
                  <button key={state} onClick={() => setTemporalState(state)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      temporalState === state ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                    }`}
                  >
                    {TEMPORAL_LABELS[state]}
                  </button>
                ))}
              </div>
            </div>

            {/* Emotional Level */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nivel Vibracional (Hawkins)</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {HAWKINS_SCALE.map((level) => (
                  <button key={level.key} onClick={() => setEmotionalLevel(level.key)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all text-center ${
                      emotionalLevel === level.key ? 'text-white shadow-lg scale-105 ring-2 ring-white/30' : 'text-slate-300 opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: emotionalLevel === level.key ? EMOTIONAL_COLORS[level.key] : `${EMOTIONAL_COLORS[level.key]}40` }}
                  >
                    <span className="block font-bold">{level.calibration}</span>
                    <span className="block text-[10px] leading-tight">{level.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      category === cat ? 'text-white shadow-lg scale-105' : 'text-slate-400 bg-slate-700 hover:bg-slate-600'
                    }`}
                    style={category === cat ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
          </>)}

          {/* ── Tab Imagen ───────────────────────────────────────────────────── */}
          {activeTab === 'imagen' && !isRootNode && (
          <div className="space-y-4">

            {/* Selector de modo */}
            <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900/60">
              {([
                { key: 'text',    label: 'Text to Image', icon: '✨' },
                { key: 'img2img', label: 'Image to Image', icon: '🖼️' },
                { key: 'url',     label: 'URL',            icon: '🔗' },
              ] as { key: typeof imageMode; label: string; icon: string }[]).map((m) => (
                <button
                  key={m.key}
                  onClick={() => { setImageMode(m.key); setImageError(null); }}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    imageMode === m.key
                      ? 'bg-violet-600 text-white shadow-inner'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Vista previa actual */}
            {generatedImageUrl && (
              <div className="relative group">
                <img
                  src={generatedImageUrl}
                  alt="Thumbnail"
                  className="w-full aspect-square object-cover rounded-xl border border-slate-600"
                />
                <button
                  onClick={() => setGeneratedImageUrl(null)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                >✕</button>
              </div>
            )}

            {/* ── Modo: Text to Image ── */}
            {imageMode === 'text' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Prompt</label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describí la imagen que querés generar..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
                />
              </div>
            )}

            {/* ── Modo: Image to Image ── */}
            {imageMode === 'img2img' && (<>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Prompt</label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describí qué querés generar a partir de la referencia..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Imágenes de referencia</label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors border border-slate-600"
                  >
                    📎 {refImageFiles.length > 0 ? `Agregar más (${refImageFiles.length})` : 'Seleccionar imágenes'}
                  </button>
                  {refImageFiles.length > 0 && (
                    <button
                      onClick={() => { setRefImageFiles([]); setRefImagePreviews([]); }}
                      className="text-slate-500 hover:text-red-400 text-xs transition-colors"
                    >✕ quitar todas</button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                </div>
                {refImagePreviews.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {refImagePreviews.map((src, i) => (
                      <div key={i} className="relative group/thumb">
                        <img src={src} alt={`Ref ${i + 1}`} className="h-16 w-16 object-cover rounded-lg border border-slate-600" />
                        <button
                          onClick={() => removeRefImage(i)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-black/70 text-white rounded-full text-[9px] hover:bg-red-600 transition-colors flex items-center justify-center opacity-0 group-hover/thumb:opacity-100"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>)}

            {/* ── Modo: URL ── */}
            {imageMode === 'url' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">URL de imagen</label>
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                />
              </div>
            )}

            {/* Error */}
            {imageError && <p className="text-red-400 text-xs">{imageError}</p>}

            {/* Botón acción */}
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generando…
                </>
              ) : imageMode === 'url' ? '🔗 Usar URL' : imageMode === 'img2img' ? '🖼️ Generar' : '✨ Generar'}
            </button>

          </div>)}{/* fin tab imagen */}

        </div>{/* fin space-y-4 */}
        </div>{/* fin p-6 */}

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-900/50 flex justify-between border-t border-slate-700 shrink-0">
          <div>
            {selectedNode && !isRootNode && (
              <button onClick={handleDelete} className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium">
                Eliminar
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={closeEditor} className="px-4 py-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors font-medium">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
            >
              {selectedNode ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
