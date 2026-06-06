import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';
import type { SetAvailabilityInput, GetAvailableSlotsInput } from '@medinest/trpc';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async setAvailability(userId: string, input: SetAvailabilityInput) {
    const doctor = await this.prisma.doctor.findFirst({ where: { userId } });
    if (!doctor) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Doctor profile not found' });
    }

    return this.prisma.doctorAvailability.upsert({
      where: {
        doctorId_dayOfWeek_startTime: {
          doctorId: doctor.id,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
        },
      },
      update: {
        endTime: input.endTime,
        slotMinutes: input.slotMinutes,
        isActive: true,
      },
      create: {
        doctorId: doctor.id,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        slotMinutes: input.slotMinutes,
      },
    });
  }

  async getMyAvailability(userId: string) {
    const doctor = await this.prisma.doctor.findFirst({ where: { userId } });
    if (!doctor) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Doctor profile not found' });
    }

    return this.prisma.doctorAvailability.findMany({
      where: { doctorId: doctor.id, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async deleteAvailability(id: string) {
    return this.prisma.doctorAvailability.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAvailableSlots(input: GetAvailableSlotsInput) {
    const date = new Date(input.date);
    const dayOfWeek = date.getDay();

    const availabilities = await this.prisma.doctorAvailability.findMany({
      where: { doctorId: input.doctorId, dayOfWeek, isActive: true },
      orderBy: { startTime: 'asc' },
    });

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: input.doctorId,
        scheduledAt: {
          gte: new Date(`${input.date}T00:00:00`),
          lt: new Date(`${input.date}T23:59:59`),
        },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
    });

    const bookedTimes = new Set(
      existingAppointments.map((a) => {
        const d = new Date(a.scheduledAt);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }),
    );

    const slots: { time: string; available: boolean }[] = [];

    for (const avail of availabilities) {
      const [startH, startM] = avail.startTime.split(':').map(Number);
      const [endH, endM] = avail.endTime.split(':').map(Number);
      let current = startH * 60 + startM;
      const end = endH * 60 + endM;

      while (current + avail.slotMinutes <= end) {
        const h = String(Math.floor(current / 60)).padStart(2, '0');
        const m = String(current % 60).padStart(2, '0');
        const time = `${h}:${m}`;
        slots.push({ time, available: !bookedTimes.has(time) });
        current += avail.slotMinutes;
      }
    }

    return slots;
  }
}
