import { useState } from 'react';

const PASSWORD = 'epifania';
const STORAGE_KEY = 'mv_auth';

export function isAuthenticated(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

interface LoginViewProps {
  onSuccess: () => void;
}

export default function LoginView({ onSuccess }: LoginViewProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, '1');
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setPassword('');
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 px-6">
      {/* Logo / ícono */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-4xl shadow-xl shadow-indigo-500/10">
          🧠
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Mindverse</h1>
        <p className="text-slate-400 text-sm">Tu universo de pensamientos</p>
      </div>

      {/* Card de login */}
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl transition-all ${shake ? 'animate-shake' : ''}`}
      >
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Clave de acceso
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder="••••••••"
          autoFocus
          className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-white placeholder-slate-500 outline-none transition-all text-base
            ${error
              ? 'border-red-500 focus:border-red-400'
              : 'border-slate-600 focus:border-indigo-500'
            }`}
        />
        {error && (
          <p className="mt-2 text-red-400 text-xs font-medium">Clave incorrecta. Intentá de nuevo.</p>
        )}

        <button
          type="submit"
          className="mt-5 w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/25 text-sm"
        >
          Ingresar →
        </button>
      </form>

      <p className="mt-8 text-slate-600 text-xs">⚡ Neuron</p>
    </div>
  );
}
