import { initTRPC, TRPCError } from '@trpc/server';
import type { Context, AuthUser } from './context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(isAuthed);

type UserRole = AuthUser['role'];

const hasRole = (...roles: UserRole[]) =>
  middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });

export const adminProcedure = t.procedure.use(isAuthed).use(hasRole('ADMIN'));
export const doctorProcedure = t.procedure.use(isAuthed).use(hasRole('DOCTOR', 'ADMIN'));
export const pharmacistProcedure = t.procedure.use(isAuthed).use(hasRole('PHARMACIST', 'ADMIN'));
export const patientProcedure = t.procedure.use(isAuthed).use(hasRole('PATIENT'));
