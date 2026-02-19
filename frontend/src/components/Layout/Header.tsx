import { useMindverseStore } from '../../store/mindverseStore';
import ProfileMenu from '../Auth/ProfileMenu';

type View = 'home' | 'mapa';

interface HeaderProps {
  activeView: View;
  onViewChange: (view: View) => void;
  syncStatus?: 'idle' | 'syncing' | 'error';
  onLogout?: () => void;
  onProfile?: () => void;
}

export default function Header({ activeView, onViewChange, syncStatus = 'idle', onLogout, onProfile }: HeaderProps) {
  const resetToMockData = useMindverseStore((state) => state.resetToMockData);

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
      {/* Logo + Nombre */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-xl font-bold text-white">Mindverse</h1>
            {syncStatus === 'syncing' && (
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" title="Sincronizando…" />
            )}
            {syncStatus === 'error' && (
              <span className="w-2 h-2 rounded-full bg-red-400" title="Sin conexión al backend" />
            )}
            {syncStatus === 'idle' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Sincronizado" />
            )}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400">Mapa de Estado Mental</p>
        </div>
      </div>

      {/* Navegación Home / Mapa */}
      <nav className="flex items-center gap-1 bg-slate-900 rounded-xl p-1">
        <button
          onClick={() => onViewChange('home')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            activeView === 'home'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          🏠 <span>Home</span>
        </button>
        <button
          onClick={() => onViewChange('mapa')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            activeView === 'mapa'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          🗺️ <span>Mapa</span>
        </button>
      </nav>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => resetToMockData()}
          className="p-2 sm:px-3 sm:py-2 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          title="Resetear datos"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline">Resetear</span>
        </button>

        <div className="w-px h-6 bg-slate-700" />

        <ProfileMenu onLogout={onLogout ?? (() => window.location.reload())} onProfile={onProfile} />
      </div>
    </header>
  );
}
