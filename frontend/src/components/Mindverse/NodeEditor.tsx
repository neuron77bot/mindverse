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
  const [inNodeId, setInNodeId]           = useState<string>(ROOT_NODE_ID);
  const [outNodeId, setOutNodeId]         = useState<string>('');

  // ── Imagen ────────────────────────────────────────────────────────────────
  const [imagePrompt, setImagePrompt]       = useState('');
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
      const inConn  = connections.find((c) => c.target === selectedNode.id);
      const outConn = connections.find((c) => c.source === selectedNode.id);
      setInNodeId(inConn?.source || '');
      setOutNodeId(outConn?.target || '');
      setGeneratedImageUrl(selectedNode.imageUrl || null);
    } else {
      setContent(''); setDescription('');
      setCategory('HEALTH');
      setTemporalState(activeTemporalFilter === 'ALL' ? 'PRESENT' : activeTemporalFilter);
      setEmotionalLevel('NEUTRALITY');
      setInNodeId(ROOT_NODE_ID); setOutNodeId('');
      setGeneratedImageUrl(null);
    }
    setImagePrompt('');
    setRefImageFiles([]);
    setRefImagePreviews([]);
    setImageError(null);
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
    if (!imagePrompt.trim()) return;
    setIsGenerating(true);
    setImageError(null);

    const node = buildNodePayload();

    try {
      if (refImageFiles.length > 0) {
        // ── Image-to-image: subir todos los archivos en paralelo ──────────────
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
            node,
          }),
        });
        if (!res.ok) throw new Error('Error generando imagen');
        const data = await res.json();
        setGeneratedImageUrl(data.images?.[0]?.url ?? null);

      } else {
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
      });

      if (!isRootNode) {
        const oldInConn  = connections.find((c) => c.target === selectedNode.id);
        const oldOutConn = connections.find((c) => c.source === selectedNode.id);
        if (oldInConn?.source !== inNodeId) {
          if (oldInConn) deleteConnection(oldInConn.id);
          if (inNodeId) addConnection({ id: uuidv4(), source: inNodeId, target: selectedNode.id });
        }
        if (oldOutConn?.target !== outNodeId) {
          if (oldOutConn) deleteConnection(oldOutConn.id);
          if (outNodeId) addConnection({ id: uuidv4(), source: selectedNode.id, target: outNodeId });
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
      };
      addNode(newNode);
      if (inNodeId)  addConnection({ id: uuidv4(), source: inNodeId,  target: newNode.id });
      if (outNodeId) addConnection({ id: uuidv4(), source: newNode.id, target: outNodeId });
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">→ IN</label>
                  <select value={inNodeId} onChange={(e) => setInNodeId(e.target.value)} className={selectClass}>
                    <option value="">— Ninguno —</option>
                    {otherNodes.map((n) => <option key={n.id} value={n.id}>{n.content}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">→ OUT</label>
                  <select value={outNodeId} onChange={(e) => setOutNodeId(e.target.value)} className={selectClass}>
                    <option value="">— Ninguno —</option>
                    {otherNodes.map((n) => <option key={n.id} value={n.id}>{n.content}</option>)}
                  </select>
                </div>
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
        <div className="mt-0">
          <div className="border border-slate-600 rounded-xl p-4 space-y-3 bg-slate-900/40">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎨</span>
              <span className="text-sm font-semibold text-slate-200">Imagen (thumbnail)</span>
            </div>

            {/* Vista previa actual */}
            {generatedImageUrl && (
              <div className="relative group">
                <img
                  src={generatedImageUrl}
                  alt="Thumbnail"
                  className="w-full h-40 object-cover rounded-lg border border-slate-600"
                />
                <button
                  onClick={() => setGeneratedImageUrl(null)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                >✕</button>
              </div>
            )}

            {/* Prompt */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Prompt de imagen</label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describí la imagen que querés generar..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
              />
            </div>

            {/* Imágenes de referencia */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Imágenes de referencia{' '}
                <span className="text-slate-500">(opcional — activa image-to-image; podés agregar varias)</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors border border-slate-600"
                >
                  📎 {refImageFiles.length > 0 ? `Agregar más (${refImageFiles.length} seleccionada${refImageFiles.length > 1 ? 's' : ''})` : 'Seleccionar imágenes'}
                </button>
                {refImageFiles.length > 0 && (
                  <button
                    onClick={() => { setRefImageFiles([]); setRefImagePreviews([]); }}
                    className="text-slate-500 hover:text-red-400 text-xs transition-colors"
                  >✕ quitar todas</button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              </div>

              {/* Miniaturas de referencia */}
              {refImagePreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {refImagePreviews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={src}
                        alt={`Ref ${i + 1}`}
                        className="h-16 w-16 object-cover rounded-lg border border-slate-600"
                      />
                      <button
                        onClick={() => removeRefImage(i)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-black/70 text-white rounded-full text-[9px] hover:bg-red-600 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {imageError && (
              <p className="text-red-400 text-xs">{imageError}</p>
            )}

            {/* Botón generar */}
            <button
              onClick={handleGenerateImage}
              disabled={!imagePrompt.trim() || isGenerating}
              className="w-full py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generando…
                </>
              ) : (
                <>
                  {refImageFiles.length > 0
                    ? `🖼️ Image-to-image (${refImageFiles.length} img${refImageFiles.length > 1 ? 's' : ''})`
                    : '✨ Text-to-image'
                  }
                </>
              )}
            </button>
          </div>{/* fin border rounded-xl */}
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
