import { z } from 'zod';

export const updatePatientProfileSchema = z.object({
  address: z.string().optional(),
  insuranceNumber: z.string().optional(),
});

export type UpdatePatientProfileInput = z.infer<typeof updatePatientProfileSchema>;
