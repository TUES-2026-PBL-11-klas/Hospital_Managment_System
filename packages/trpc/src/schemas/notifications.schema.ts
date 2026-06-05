import { z } from 'zod';

export const markNotificationReadSchema = z.object({
  id: z.string().uuid(),
});

export const markAllReadSchema = z.object({
  patientId: z.string().uuid(),
});
