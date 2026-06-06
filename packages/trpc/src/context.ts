import type { inferAsyncReturnType } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'PATIENT';
}

export interface TRPCContext {
  user: AuthUser | null;
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
}

export type Context = inferAsyncReturnType<() => TRPCContext>;
