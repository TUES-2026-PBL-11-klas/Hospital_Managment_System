import { z } from 'zod';

export const setAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  slotMinutes: z.number().int().min(15).max(120).default(30),
});

export const deleteAvailabilitySchema = z.object({
  id: z.string().uuid(),
});

export const getAvailableSlotsSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
});

export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>;
export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsSchema>;
