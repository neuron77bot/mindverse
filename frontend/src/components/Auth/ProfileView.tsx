import { useState } from 'react';
import { getStoredUser, type GoogleUser } from './LoginView';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface ProfileViewProps {
  onBack: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function ProfileView({ onBack }: ProfileViewProps) {
  const user = getStoredUser();

  const [name, setName]         = useState(user?.name     ?? '');
  const [bio, setBio]           = useState('');
  const [location, setLocation] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loadedExtra, setLoadedExtra] = useState(false);

  // Cargar bio/location del backend si aún no lo hicimos
  if (!loadedExtra && user?.sub) {
    setLoadedExtra(true);
    fetch(`${API_BASE}/users/${user.sub}`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          setBio(data.bio ?? '');
          setLocation(data.location ?? '');
          if (data.name) setName(data.name);
        }
      })
      .catch(() => {});
  }

  const handleSave = async () => {
    if (!user?.sub) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`${API_BASE}/users/${user.sub}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, location }),
      });
      if (!res.ok) throw new Error();

      // Actualizar nombre en localStorage
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

  const inputClass = "w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm";

  return (
    <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-8 max-w-xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          ← Volver
        </button>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300 text-sm font-medium">Mi perfil</span>
      </div>

      {/* Avatar + info base */}
      <div className="flex flex-col items-center mb-8">
        {user?.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500/40 shadow-2xl shadow-indigo-500/20 mb-4"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-indigo-500/20 mb-4">
            {(user?.name ?? 'U')[0]}
          </div>
        )}
        <p className="text-slate-400 text-sm">{user?.email}</p>
        <span className="mt-2 px-3 py-0.5 bg-indigo-600/20 text-indigo-400 text-xs font-medium rounded-full border border-indigo-500/30">
          Google Account
        </span>
      </div>

      {/* Formulario */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre</label>
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
            className={`${inputClass} opacity-50 cursor-not-allowed`}
          />
          <p className="text-slate-600 text-xs mt-1">El email no se puede modificar</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Ubicación</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ej: Buenos Aires, Argentina"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Contá algo sobre vos..."
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Botón guardar */}
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
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
          {saveStatus === 'saved'  && '✓ Guardado'}
          {saveStatus === 'error'  && '✕ Error al guardar'}
          {saveStatus === 'idle'   && 'Guardar cambios'}
          {saveStatus === 'saving' && 'Guardando…'}
        </button>
      </div>
    </div>
  );
}
