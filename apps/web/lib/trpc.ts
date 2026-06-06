'use client';

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../api/src/trpc/trpc.router';

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/trpc`,
        headers() {
          if (typeof window === 'undefined') return {};
          const token = localStorage.getItem('medinest_token');
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
