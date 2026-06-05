import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateAppointmentInput, CreateDiagnosisInput } from '@medinest/trpc';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(data: CreateAppointmentInput) {
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        scheduledAt: new Date(data.scheduledAt),
        notes: data.notes,
      },
      include: {
        patient: true,
        doctor: { include: { user: { select: { email: true } } } },
      },
    });

    const dateStr = new Date(data.scheduledAt).toLocaleString('bg-BG', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    });

    await this.notifications.create(
      data.patientId,
      'APPOINTMENT_BOOKED',
      'Часът е записан',
      `Вашият час при д-р ${appointment.doctor.user.email} е насрочен за ${dateStr}.`,
    );

    return appointment;
  }

  async cancel(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
    }
    if (appointment.status === 'COMPLETED') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot cancel a completed appointment' });
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.notifications.create(
      appointment.patientId,
      'APPOINTMENT_CANCELLED',
      'Часът е отменен',
      `Вашият час беше отменен.`,
    );

    return updated;
  }

  async updateStatus(id: string, status: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
    }
    return this.prisma.appointment.update({
      where: { id },
      data: { status: status as never },
    });
  }

  async getById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: { select: { email: true } } } },
        doctor: { include: { user: { select: { email: true } } } },
        diagnosis: { include: { prescriptions: { include: { items: { include: { medication: true } } } } } },
        symptomChecks: true,
      },
    });
    if (!appointment) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
    }
    return appointment;
  }

  async createDiagnosis(data: CreateDiagnosisInput) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: data.appointmentId },
    });
    if (!appointment) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
    }

    const diagnosis = await this.prisma.diagnosis.create({
      data: {
        appointmentId: data.appointmentId,
        icdCode: data.icdCode,
        description: data.description,
      },
    });

    await this.notifications.create(
      appointment.patientId,
      'DIAGNOSIS_ADDED',
      'Нова диагноза',
      `Лекарят е добавил диагноза: ${data.description.substring(0, 80)}.`,
    );

    return diagnosis;
  }

  async getDiagnosisByAppointment(appointmentId: string) {
    const diagnosis = await this.prisma.diagnosis.findUnique({
      where: { appointmentId },
      include: {
        prescriptions: {
          include: { items: { include: { medication: true } } },
        },
      },
    });
    if (!diagnosis) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Diagnosis not found' });
    }
    return diagnosis;
  }

  async getTimeline(userId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { userId } });
    if (!patient) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Patient profile not found' });
    }

    return this.prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: { include: { user: { select: { email: true } } } },
        diagnosis: {
          include: {
            prescriptions: {
              include: { items: { include: { medication: true } } },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }
}
