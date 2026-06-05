'use client';

export interface SessionUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'PATIENT';
}

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('medinest_token');
}

export function setToken(token: string): void {
  localStorage.setItem('medinest_token', token);
  setCookie('medinest_token', token);
}

export function getUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('medinest_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setUser(user: SessionUser): void {
  localStorage.setItem('medinest_user', JSON.stringify(user));
  setCookie('medinest_role', user.role);
}

export function logout(): void {
  localStorage.removeItem('medinest_token');
  localStorage.removeItem('medinest_user');
  deleteCookie('medinest_token');
  deleteCookie('medinest_role');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getRoleDashboard(role: string): string {
  const routes: Record<string, string> = {
    PATIENT: '/dashboard/patient',
    DOCTOR: '/dashboard/doctor',
    PHARMACIST: '/dashboard/pharmacist',
    ADMIN: '/dashboard/admin',
    NURSE: '/dashboard/doctor',
  };
  return routes[role] ?? '/';
}
