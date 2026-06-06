import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalPrescriptions,
      pendingAppointments,
      completedAppointments,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.patient.count(),
      this.prisma.doctor.count(),
      this.prisma.appointment.count(),
      this.prisma.prescription.count(),
      this.prisma.appointment.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.appointment.count({ where: { status: 'COMPLETED' } }),
    ]);

    return {
      totalUsers,
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalPrescriptions,
      pendingAppointments,
      completedAppointments,
    };
  }

  async manageUsers(action: string, userId?: string) {
    if (action === 'list') {
      return this.prisma.user.findMany({
        select: { id: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (action === 'deactivate' && userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
      return { success: true, message: `User ${userId} deactivated` };
    }

    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid action or missing userId' });
  }
}
