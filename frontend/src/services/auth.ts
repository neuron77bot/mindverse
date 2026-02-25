import { removeToken } from './authHeaders';

const STORAGE_KEY = 'mv_auth';
const USER_KEY = 'mv_user';

export interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

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
  removeToken();
}
