import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePrescriptionInput } from '@medinest/trpc';

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePrescriptionInput) {
    const diagnosis = await this.prisma.diagnosis.findUnique({ where: { id: data.diagnosisId } });
    if (!diagnosis) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Diagnosis not found' });
    }

    return this.prisma.prescription.create({
      data: {
        diagnosisId: data.diagnosisId,
        validUntil: new Date(data.validUntil),
        items: {
          create: data.items.map((item) => ({
            medicationId: item.medicationId,
            dosage: item.dosage,
            frequency: item.frequency,
            durationDays: item.durationDays,
          })),
        },
      },
      include: { items: { include: { medication: true } } },
    });
  }

  async updateStatus(id: string, status: string) {
    const prescription = await this.prisma.prescription.findUnique({ where: { id } });
    if (!prescription) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Prescription not found' });
    }
    return this.prisma.prescription.update({
      where: { id },
      data: { status: status as never },
    });
  }

  async getByPatient(patientId: string) {
    return this.prisma.prescription.findMany({
      where: {
        diagnosis: {
          appointment: { patientId },
        },
      },
      include: {
        items: { include: { medication: true } },
        diagnosis: { include: { appointment: { include: { doctor: true } } } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }
}
