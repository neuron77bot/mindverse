import ProfileMenu from '../Auth/ProfileMenu';

interface MobileHeaderProps {
  onMenuClick: () => void;
  onLogout: () => void;
  onProfile: () => void;
}

export default function MobileHeader({ onMenuClick, onLogout, onProfile }: MobileHeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
      {/* Hamburger Menu Button */}
      <button
        onClick={onMenuClick}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-700 transition-colors"
        aria-label="Abrir menú"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo/Title (centered) */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <span className="text-white font-bold text-lg">Mindverse</span>
      </div>

      {/* Profile Menu */}
      <div className="flex items-center">
        <ProfileMenu onLogout={onLogout} onProfile={onProfile} />
      </div>
    </header>
  );
}
