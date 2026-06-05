'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { setToken, setUser, getRoleDashboard } from '@/lib/auth';

const ROLES = [
  { value: 'PATIENT', label: 'Пациент' },
  { value: 'DOCTOR', label: 'Лекар' },
  { value: 'NURSE', label: 'Медицинска сестра' },
  { value: 'PHARMACIST', label: 'Фармацевт' },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<typeof ROLES[number]['value']>('PATIENT');
  const [error, setError] = useState('');

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess(data) {
      setToken(data.token);
      setUser(data.user as Parameters<typeof setUser>[0]);
      router.push(getRoleDashboard(data.user.role));
    },
    onError(err) {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    registerMutation.mutate({ email, password, role });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏥</div>
          <h1 className="text-2xl font-bold text-primary-900">MediNest</h1>
          <p className="text-gray-500 text-sm mt-1">Създайте нов акаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имейл</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@medinest.bg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Парола</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 8 символа"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Роля</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={registerMutation.isLoading}
          >
            {registerMutation.isLoading ? 'Регистрация...' : 'Регистрирай се'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Вече имате акаунт?{' '}
          <Link href="/login" className="text-primary-600 hover:underline">
            Влезте
          </Link>
        </p>
      </div>
    </div>
  );
}
