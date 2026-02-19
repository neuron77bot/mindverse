import { GoogleLogin } from '@react-oauth/google';

const STORAGE_KEY  = 'mv_auth';
const USER_KEY     = 'mv_user';
const API_BASE     = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface GoogleUser {
  sub:     string;
  name:    string;
  email:   string;
  picture: string;
}

// ── Helpers de sesión ─────────────────────────────────────────────────────────
export function isAuthenticated(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function getStoredUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Componente ────────────────────────────────────────────────────────────────
interface LoginViewProps {
  onSuccess: () => void;
}

export default function LoginView({ onSuccess }: LoginViewProps) {

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    const { credential } = credentialResponse;
    if (!credential) return;

    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (!res.ok) throw new Error('Error de autenticación');
      const { user } = await res.json();

      localStorage.setItem(STORAGE_KEY, '1');
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      onSuccess();
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900 overflow-hidden relative">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-4">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Mindverse</h1>
          <p className="text-slate-400 text-sm mt-1">Mapa de Estado Mental</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => console.error('Google login failed')}
              theme="filled_black"
              shape="pill"
              size="large"
              text="signin_with"
            />
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Solo usuarios autorizados
        </p>
      </div>
    </div>
  );
}
