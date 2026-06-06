import { z } from 'zod';

export const prescriptionItemSchema = z.object({
  medicationId: z.string().uuid(),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  durationDays: z.number().int().positive(),
});

export const createPrescriptionSchema = z.object({
  diagnosisId: z.string().uuid(),
  validUntil: z.string().datetime(),
  items: z.array(prescriptionItemSchema).min(1),
});

export const updatePrescriptionStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['ISSUED', 'DISPENSED', 'EXPIRED', 'CANCELLED']),
});

export const getByPatientSchema = z.object({
  patientId: z.string().uuid(),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
