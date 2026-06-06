import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { z } from 'zod';

type AddInventoryInput = z.infer<typeof import('@medinest/trpc').addInventorySchema>;

@Injectable()
export class PharmacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getInventory() {
    return this.prisma.inventory.findMany({
      include: { medication: true, pharmacist: { include: { user: { select: { email: true } } } } },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async updateStock(inventoryId: string, quantity: number) {
    const inventory = await this.prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (!inventory) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Inventory record not found' });
    }
    return this.prisma.inventory.update({
      where: { id: inventoryId },
      data: { quantity },
    });
  }

  async dispensePrescription(prescriptionId: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: { include: { medication: true } },
        diagnosis: {
          include: {
            appointment: { include: { patient: true } },
          },
        },
      },
    });
    if (!prescription) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Prescription not found' });
    }
    if (prescription.status !== 'ISSUED') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Prescription cannot be dispensed' });
    }

    for (const item of prescription.items) {
      const inventory = await this.prisma.inventory.findFirst({
        where: { medicationId: item.medicationId, quantity: { gt: 0 } },
        orderBy: { expiryDate: 'asc' },
      });
      if (!inventory) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Insufficient stock for ${item.medication.name}`,
        });
      }
      await this.prisma.inventory.update({
        where: { id: inventory.id },
        data: { quantity: { decrement: 1 } },
      });
    }

    const updated = await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: 'DISPENSED' },
    });

    const patientId = prescription.diagnosis?.appointment?.patientId;
    if (patientId) {
      const medicationNames = prescription.items.map((i) => i.medication.name).join(', ');
      await this.notifications.create(
        patientId,
        'PRESCRIPTION_DISPENSED',
        'Рецептата е отпусната',
        `Вашата рецепта беше отпусната. Лекарства: ${medicationNames}.`,
      );
    }

    return updated;
  }

  async addInventory(userId: string, data: { medicationId: string; batchNumber: string; quantity: number; expiryDate: string }) {
    const pharmacist = await this.prisma.pharmacist.findFirst({ where: { userId } });
    if (!pharmacist) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Pharmacist profile not found' });
    }
    return this.prisma.inventory.create({
      data: {
        medicationId: data.medicationId,
        pharmacistId: pharmacist.id,
        batchNumber: data.batchNumber,
        quantity: data.quantity,
        expiryDate: new Date(data.expiryDate),
      },
      include: { medication: true },
    });
  }
}
