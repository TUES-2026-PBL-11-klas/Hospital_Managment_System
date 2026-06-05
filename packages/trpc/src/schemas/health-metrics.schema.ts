import { z } from 'zod';

export const metricTypeSchema = z.enum([
  'BLOOD_PRESSURE',
  'WEIGHT',
  'GLUCOSE',
  'HEART_RATE',
  'TEMPERATURE',
  'OXYGEN_SATURATION',
]);

export const logHealthMetricSchema = z.object({
  type: metricTypeSchema,
  value: z.number().positive(),
  unit: z.string().min(1),
  notes: z.string().optional(),
  recordedAt: z.string().datetime().optional(),
});

export const getHealthMetricsSchema = z.object({
  type: metricTypeSchema.optional(),
  limit: z.number().int().positive().max(100).default(30),
});

export type LogHealthMetricInput = z.infer<typeof logHealthMetricSchema>;
export type GetHealthMetricsInput = z.infer<typeof getHealthMetricsSchema>;
