import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';
import type { LogHealthMetricInput, GetHealthMetricsInput } from '@medinest/trpc';

@Injectable()
export class HealthMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(userId: string, input: LogHealthMetricInput) {
    const patient = await this.prisma.patient.findFirst({ where: { userId } });
    if (!patient) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Patient profile not found' });
    }

    return this.prisma.healthMetric.create({
      data: {
        patientId: patient.id,
        type: input.type,
        value: input.value,
        unit: input.unit,
        notes: input.notes,
        recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
      },
    });
  }

  async getMetrics(userId: string, input: GetHealthMetricsInput) {
    const patient = await this.prisma.patient.findFirst({ where: { userId } });
    if (!patient) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Patient profile not found' });
    }

    return this.prisma.healthMetric.findMany({
      where: {
        patientId: patient.id,
        ...(input.type ? { type: input.type } : {}),
      },
      orderBy: { recordedAt: 'desc' },
      take: input.limit,
    });
  }

  async deleteMetric(id: string) {
    return this.prisma.healthMetric.delete({ where: { id } });
  }
}
