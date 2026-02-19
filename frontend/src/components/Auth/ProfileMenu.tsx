import { useState, useRef, useEffect } from 'react';
import { logout, getStoredUser } from './LoginView';

interface ProfileMenuProps {
  onLogout: () => void;
}

export default function ProfileMenu({ onLogout }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = getStoredUser();

  const displayName  = user?.name    ?? 'Usuario';
  const displayEmail = user?.email   ?? '';
  const picture      = user?.picture ?? null;
  const initial      = displayName[0]?.toUpperCase() ?? 'U';

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    onLogout();
  };

  return (
    <div ref={ref} className="relative">
      {/* Avatar botón */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-700 transition-colors group"
      >
        {picture ? (
          <img
            src={picture}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover shadow-lg shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shrink-0">
            {initial}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-slate-300 group-hover:text-white transition-colors max-w-[100px] truncate">
          {displayName.split(' ')[0]}
        </span>
        <svg
          className={`hidden sm:block w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
          {/* Info usuario */}
          <div className="px-4 py-3 border-b border-slate-700">
            <div className="flex items-center gap-3">
              {picture ? (
                <img
                  src={picture}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover shadow-lg shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{displayName}</p>
                <p className="text-slate-400 text-xs truncate">{displayEmail}</p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="p-1.5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
