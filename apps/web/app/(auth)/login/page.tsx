'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { setToken, setUser, getRoleDashboard } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = trpc.auth.login.useMutation({
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
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏥</div>
          <h1 className="text-2xl font-bold text-primary-900">MediNest</h1>
          <p className="text-gray-500 text-sm mt-1">Влезте в профила си</p>
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
              placeholder="doctor@medinest.bg"
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
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loginMutation.isLoading}
          >
            {loginMutation.isLoading ? 'Влизане...' : 'Влез'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Нямате акаунт?{' '}
          <Link href="/register" className="text-primary-600 hover:underline">
            Регистрирайте се
          </Link>
        </p>
      </div>
    </div>
  );
}
