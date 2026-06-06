import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdatePatientProfileInput } from '@medinest/trpc';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { userId },
      include: { user: { select: { email: true, role: true } } },
    });
    if (!patient) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Patient profile not found' });
    }
    return patient;
  }

  async updateProfile(userId: string, data: UpdatePatientProfileInput) {
    const patient = await this.prisma.patient.findFirst({ where: { userId } });
    if (!patient) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Patient profile not found' });
    }
    return this.prisma.patient.update({ where: { id: patient.id }, data });
  }

  async getAppointments(userId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { userId } });
    if (!patient) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Patient not found' });
    }
    return this.prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: { include: { user: { select: { email: true } } } },
        diagnosis: { include: { prescriptions: { include: { items: true } } } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async getPrescriptions(userId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { userId } });
    if (!patient) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Patient not found' });
    }
    return this.prisma.prescription.findMany({
      where: {
        diagnosis: {
          appointment: { patientId: patient.id },
        },
      },
      include: {
        items: { include: { medication: true } },
        diagnosis: { include: { appointment: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }
}
