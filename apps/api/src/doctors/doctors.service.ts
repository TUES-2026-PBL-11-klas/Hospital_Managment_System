import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSchedule(userId: string) {
    const doctor = await this.prisma.doctor.findFirst({ where: { userId } });
    if (!doctor) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Doctor profile not found' });
    }
    return this.prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: { include: { user: { select: { email: true } } } },
        diagnosis: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getPatients(userId: string) {
    const doctor = await this.prisma.doctor.findFirst({ where: { userId } });
    if (!doctor) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Doctor profile not found' });
    }
    const appointments = await this.prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: { patient: { include: { user: { select: { email: true } } } } },
      distinct: ['patientId'],
    });
    return appointments.map((a) => a.patient);
  }

  async getDoctors(specialty?: string) {
    return this.prisma.doctor.findMany({
      where: specialty ? { specialty: { contains: specialty, mode: 'insensitive' } } : undefined,
      include: { user: { select: { email: true } } },
    });
  }

  async findBySpecialty(specialty: string) {
    return this.prisma.doctor.findMany({
      where: { specialty: { contains: specialty, mode: 'insensitive' } },
      include: { user: { select: { email: true } } },
    });
  }
}
