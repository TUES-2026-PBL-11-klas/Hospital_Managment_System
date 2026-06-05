import { z } from 'zod';

export const createDiagnosisSchema = z.object({
  appointmentId: z.string().uuid(),
  icdCode: z.string().min(1),
  description: z.string().min(1),
});

export const getByAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
});

export type CreateDiagnosisInput = z.infer<typeof createDiagnosisSchema>;
