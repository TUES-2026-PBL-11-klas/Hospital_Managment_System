'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getUser, logout, type SessionUser } from '@/lib/auth';

const NAV_ITEMS: Record<string, { href: string; label: string }[]> = {
  PATIENT: [
    { href: '/dashboard/patient', label: 'Начало' },
    { href: '/dashboard/patient/symptom-check', label: 'Проверка на симптоми' },
    { href: '/dashboard/patient/prescriptions', label: 'Рецепти' },
  ],
  DOCTOR: [
    { href: '/dashboard/doctor', label: 'График' },
    { href: '/dashboard/doctor/appointments', label: 'Часове' },
    { href: '/dashboard/doctor/prescriptions/new', label: 'Нова рецепта' },
  ],
  PHARMACIST: [
    { href: '/dashboard/pharmacist', label: 'Инвентар' },
    { href: '/dashboard/pharmacist/dispense', label: 'Отпускане' },
  ],
  ADMIN: [
    { href: '/dashboard/admin', label: 'Статистики' },
  ],
  NURSE: [
    { href: '/dashboard/doctor', label: 'График' },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace('/login');
    } else {
      setUser(u);
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role] ?? [];

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-primary-900 text-white flex flex-col">
        <div className="p-6 border-b border-primary-700">
          <div className="text-xl font-bold">🏥 MediNest</div>
          <div className="text-primary-300 text-xs mt-1 truncate">{user.email}</div>
          <div className="mt-1">
            <span className="text-xs bg-primary-700 px-2 py-0.5 rounded-full">{user.role}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-primary-600 text-white'
                  : 'text-primary-200 hover:bg-primary-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-primary-700">
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-primary-300 hover:text-white px-3 py-2 rounded-lg hover:bg-primary-800 transition-colors"
          >
            Изход
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
