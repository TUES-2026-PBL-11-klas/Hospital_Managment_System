import { z } from 'zod';

export const analyzeSymptomSchema = z.object({
  symptomsText: z.string().min(10, 'Please describe your symptoms in more detail'),
  appointmentId: z.string().uuid().optional(),
});

export const getSymptomHistorySchema = z.object({
  patientId: z.string().uuid(),
});

export type AnalyzeSymptomInput = z.infer<typeof analyzeSymptomSchema>;
