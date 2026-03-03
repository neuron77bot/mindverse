import { useState } from 'react';
import { toast } from 'sonner';
import { getStoredUser, type GoogleUser } from '../../services/auth';
import { authHeaders, authHeadersOnly } from '../../services/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function ProfileView() {
  const user = getStoredUser();

  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loadedExtra, setLoadedExtra] = useState(false);
  const [cinemaToken, setCinemaToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);

  // Construir URL de Cinema usando VITE_BASE
  const basePath = import.meta.env.VITE_BASE || '/';
  const cinemaUrl = cinemaToken 
    ? `${window.location.origin}${basePath}cinema?token=${cinemaToken}`
    : null;

  if (!loadedExtra && user?.sub) {
    setLoadedExtra(true);
    fetch(`${API_BASE}/users/${user.sub}`, { headers: authHeadersOnly() })
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          setBio(data.bio ?? '');
          setLocation(data.location ?? '');
          if (data.name) setName(data.name);
        }
      })
      .catch(() => {});

    // Fetch cinema token
    fetch(`${API_BASE}/users/me/cinema-token`, { headers: authHeadersOnly() })
      .then((r) => r.json())
      .then(({ data }) => {
        if (data?.cinemaToken) {
          setCinemaToken(data.cinemaToken);
        }
      })
      .catch(() => {});

    // Fetch API Keys
    loadApiKeys();
  }

  const loadApiKeys = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/api-keys`, {
        headers: authHeadersOnly(),
      });
      if (res.ok) {
        const { data } = await res.json();
        setApiKeys(data || []);
      }
    } catch {
      // Silently fail
    }
  };

  const handleGenerateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Ingresa un nombre para la API Key');
      return;
    }

    setLoadingApiKeys(true);
    try {
      const res = await fetch(`${API_BASE}/users/api-keys`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (!res.ok) throw new Error();

      const { data } = await res.json();
      setGeneratedKey(data.key);
      setShowNewKeyModal(true);
      setNewKeyName('');
      toast.success('API Key generada exitosamente');
      await loadApiKeys();
    } catch {
      toast.error('Error al generar API Key');
    } finally {
      setLoadingApiKeys(false);
    }
  };

  const handleDeleteApiKey = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la API Key "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/api-keys/${id}`, {
        method: 'DELETE',
        headers: authHeadersOnly(),
      });

      if (!res.ok) throw new Error();

      toast.success('API Key eliminada');
      await loadApiKeys();
    } catch {
      toast.error('Error al eliminar API Key');
    }
  };

  const handleToggleApiKey = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/users/api-keys/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ enabled }),
      });

      if (!res.ok) throw new Error();

      toast.success(enabled ? 'API Key habilitada' : 'API Key deshabilitada');
      await loadApiKeys();
    } catch {
      toast.error('Error al actualizar API Key');
    }
  }

  const handleCopyLink = () => {
    if (!cinemaUrl) return;
    navigator.clipboard.writeText(cinemaUrl);
    toast.success('Link copiado al portapapeles');
  };

  const handleRegenerateToken = async () => {
    if (!confirm('¿Estás seguro? El link anterior dejará de funcionar.')) return;

    setLoadingToken(true);
    try {
      const res = await fetch(`${API_BASE}/users/me/cinema-token/regenerate`, {
        method: 'POST',
        headers: authHeadersOnly(),
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setCinemaToken(data.cinemaToken);
      toast.success('Token regenerado exitosamente');
    } catch {
      toast.error('Error al regenerar token');
    } finally {
      setLoadingToken(false);
    }
  };

  const handleSave = async () => {
    if (!user?.sub) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`${API_BASE}/users/${user.sub}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ name, bio, location }),
      });
      if (!res.ok) throw new Error();
      const stored = getStoredUser();
      if (stored) {
        const updated: GoogleUser = { ...stored, name };
        localStorage.setItem('mv_user', JSON.stringify(updated));
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm';

  const initial = (user?.name ?? 'U')[0].toUpperCase();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
      {/* Layout - Con scroll contenido */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto">
          <div className="lg:grid lg:grid-cols-[300px_1fr] xl:grid-cols-[340px_1fr] lg:gap-8 space-y-6 lg:space-y-0">
            {/* ── Columna izquierda: tarjeta de identidad ─────────────────── */}
            <div className="space-y-4">
              {/* Card principal */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                {/* Banner */}
                <div className="h-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative">
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
                      backgroundSize: '30px 30px',
                    }}
                  />
                </div>

                {/* Avatar */}
                <div className="px-6 pb-6">
                  <div className="relative -mt-12 mb-4">
                    {user?.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-800 shadow-xl"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-slate-800 shadow-xl">
                        {initial}
                      </div>
                    )}
                  </div>

                  <h2 className="text-white font-bold text-xl leading-tight">
                    {name || user?.name}
                  </h2>

                  {location && (
                    <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {location}
                    </p>
                  )}

                  {bio && (
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed border-t border-slate-700 pt-3">
                      {bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Info cuenta */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
                <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide">
                  Cuenta
                </h3>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 leading-none mb-0.5">Proveedor</p>
                    <p className="text-sm text-white font-medium">Google</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 leading-none mb-0.5">Email</p>
                    <p className="text-sm text-white font-medium truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Columna derecha: formulario ─────────────────────────────── */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              {/* Header formulario */}
              <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">Editar perfil</h3>
                  <p className="text-slate-500 text-sm mt-0.5">Actualizá tu información personal</p>
                </div>
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Guardado
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-400 text-sm font-medium">✕ Error al guardar</span>
                )}
              </div>

              {/* Campos */}
              <div className="p-6 space-y-6">
                {/* Nombre + Email en grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Nombre <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                    <input
                      type="text"
                      value={user?.email ?? ''}
                      disabled
                      className={`${inputClass} opacity-40 cursor-not-allowed`}
                    />
                    <p className="text-slate-600 text-xs mt-1">No modificable</p>
                  </div>
                </div>

                {/* Ubicación */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Ubicación
                    </span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej: Buenos Aires, Argentina"
                    className={inputClass}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Contá algo sobre vos..."
                    rows={5}
                    className={`${inputClass} resize-none`}
                  />
                  <p className="text-slate-600 text-xs mt-1">{bio.length} / 300 caracteres</p>
                </div>

                {/* Botón */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                      saveStatus === 'saved'
                        ? 'bg-emerald-600 text-white'
                        : saveStatus === 'error'
                          ? 'bg-red-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {saveStatus === 'saving' && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {saveStatus === 'saved' && '✓ Guardado'}
                    {saveStatus === 'error' && '✕ Error'}
                    {saveStatus === 'idle' && 'Guardar cambios'}
                    {saveStatus === 'saving' && 'Guardando…'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Sección Cinema Link (fullwidth debajo) ──────────────────── */}
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20 border border-indigo-700/30 rounded-2xl overflow-hidden mt-8">
              <div className="px-6 py-5 border-b border-indigo-700/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
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
                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">🎬 Mi Cinema</h3>
                  <p className="text-indigo-300 text-sm mt-0.5">
                    Comparte tu colección estilo Netflix
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-slate-300 text-sm">
                  Compartí un link público donde cualquiera puede ver todos tus storyboards en un
                  layout moderno tipo Netflix.
                </p>

                {cinemaUrl ? (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cinemaUrl}
                        readOnly
                        className="flex-1 px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white text-sm font-mono"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
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
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Copiar
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleRegenerateToken}
                        disabled={loadingToken}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {loadingToken ? 'Regenerando...' : 'Regenerar Token'}
                      </button>
                      <a
                        href={cinemaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
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
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        Ver Mi Cinema
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 text-sm">Cargando...</div>
                )}
              </div>
            </div>

            {/* ── Sección API Keys (fullwidth debajo) ─────────────────────── */}
            <div className="lg:col-span-2 bg-gradient-to-br from-emerald-900/20 via-teal-900/20 to-cyan-900/20 border border-emerald-700/30 rounded-2xl overflow-hidden mt-8">
              <div className="px-6 py-5 border-b border-emerald-700/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
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
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">🔑 API Keys</h3>
                  <p className="text-emerald-300 text-sm mt-0.5">
                    Gestiona tus claves de acceso al API
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <p className="text-slate-300 text-sm">
                  Las API Keys te permiten acceder al API de Mindverse sin usar OAuth. Úsalas para
                  scripts, integraciones o testing.
                </p>

                {/* Generar nueva key */}
                <div className="bg-slate-800/50 border border-emerald-700/30 rounded-xl p-4 space-y-3">
                  <h4 className="text-white font-semibold text-sm">Generar nueva API Key</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateApiKey()}
                      placeholder="Nombre descriptivo (ej: Script de backup)"
                      className="flex-1 px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm"
                    />
                    <button
                      onClick={handleGenerateApiKey}
                      disabled={loadingApiKeys || !newKeyName.trim()}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                      {loadingApiKeys ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
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
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Generar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Lista de API Keys */}
                {apiKeys.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold text-sm">Tus API Keys</h4>
                    {apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-white font-medium">{key.name}</h5>
                              {key.isExpired ? (
                                <span className="px-2 py-0.5 bg-red-900/50 text-red-300 text-xs rounded-full">
                                  Expirada
                                </span>
                              ) : !key.enabled ? (
                                <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded-full">
                                  Deshabilitada
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-300 text-xs rounded-full">
                                  Activa
                                </span>
                              )}
                            </div>
                            <div className="mt-2 space-y-1 text-xs text-slate-400">
                              <div className="flex items-center gap-2">
                                <span className="font-mono bg-slate-900 px-2 py-1 rounded">
                                  {key.preview}
                                </span>
                              </div>
                              <div>
                                Creada: {new Date(key.createdAt).toLocaleDateString('es-AR')}
                              </div>
                              {key.lastUsedAt && (
                                <div>
                                  Último uso: {new Date(key.lastUsedAt).toLocaleDateString('es-AR')}
                                </div>
                              )}
                              {key.expiresAt && (
                                <div>
                                  Expira: {new Date(key.expiresAt).toLocaleDateString('es-AR')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!key.isExpired && (
                              <button
                                onClick={() => handleToggleApiKey(key.id, !key.enabled)}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-xs font-medium"
                              >
                                {key.enabled ? 'Deshabilitar' : 'Habilitar'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteApiKey(key.id, key.name)}
                              className="px-3 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-300 rounded-lg transition-colors text-xs font-medium"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                    No tienes API Keys. Genera una para empezar.
                  </div>
                )}

                {/* Ejemplo de uso */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 space-y-2">
                  <h4 className="text-white font-semibold text-sm flex items-center gap-2">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Ejemplo de uso
                  </h4>
                  <pre className="text-xs text-emerald-300 font-mono bg-slate-950 p-3 rounded-lg overflow-x-auto">
                    {`curl -H "X-API-Key: sk_live_..." \\
     ${API_BASE}/storyboards`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para mostrar la nueva API Key */}
      {showNewKeyModal && generatedKey && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-emerald-700/50 rounded-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">API Key Generada</h3>
                <p className="text-emerald-300 text-sm">
                  Guarda esta key en un lugar seguro
                </p>
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
              <p className="text-red-300 text-sm font-medium flex items-center gap-2">
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Esta es la única vez que verás esta key. No podrás recuperarla después.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Tu API Key:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generatedKey}
                  readOnly
                  className="flex-1 px-4 py-3 bg-slate-900 border border-emerald-700/50 rounded-xl text-emerald-300 font-mono text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey);
                    toast.success('API Key copiada al portapapeles');
                  }}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copiar
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowNewKeyModal(false);
                  setGeneratedKey(null);
                }}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
