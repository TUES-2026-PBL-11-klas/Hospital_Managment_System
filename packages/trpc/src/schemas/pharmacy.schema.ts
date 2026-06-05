import { z } from 'zod';

export const updateStockSchema = z.object({
  inventoryId: z.string().uuid(),
  quantity: z.number().int(),
});

export const dispensePrescriptionSchema = z.object({
  prescriptionId: z.string().uuid(),
});

export const addInventorySchema = z.object({
  medicationId: z.string().uuid(),
  batchNumber: z.string().min(1),
  quantity: z.number().int().positive(),
  expiryDate: z.string().datetime(),
});

export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type DispensePrescriptionInput = z.infer<typeof dispensePrescriptionSchema>;
