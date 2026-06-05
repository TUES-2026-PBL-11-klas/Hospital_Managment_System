import { z } from 'zod';

export const getDoctorsBySpecialtySchema = z.object({
  specialty: z.string().min(1),
});

export type GetDoctorsBySpecialtyInput = z.infer<typeof getDoctorsBySpecialtySchema>;
