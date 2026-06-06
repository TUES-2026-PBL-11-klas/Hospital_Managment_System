'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getRoleDashboard } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user) {
      router.replace(getRoleDashboard(user.role));
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
    </div>
  );
}
