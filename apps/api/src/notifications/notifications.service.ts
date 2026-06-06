import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type NotificationType =
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_CANCELLED'
  | 'PRESCRIPTION_DISPENSED'
  | 'DIAGNOSIS_ADDED'
  | 'APPOINTMENT_REMINDER';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(patientId: string, type: NotificationType, title: string, message: string) {
    return this.prisma.notification.create({
      data: { patientId, type, title, message },
    });
  }

  async getForPatient(patientId: string) {
    return this.prisma.notification.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getForUser(userId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { userId } });
    if (!patient) return [];
    return this.getForPatient(patient.id);
  }

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(patientId: string) {
    return this.prisma.notification.updateMany({
      where: { patientId, isRead: false },
      data: { isRead: true },
    });
  }

  async markAllReadForUser(userId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { userId } });
    if (!patient) return { count: 0 };
    return this.markAllRead(patient.id);
  }

  async getUnreadCount(patientId: string) {
    return this.prisma.notification.count({
      where: { patientId, isRead: false },
    });
  }

  async getUnreadCountForUser(userId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { userId } });
    if (!patient) return 0;
    return this.getUnreadCount(patient.id);
  }
}
