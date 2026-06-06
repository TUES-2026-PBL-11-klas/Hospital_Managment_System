import { Module } from '@nestjs/common';
import { TRPCService } from './trpc.service';
import { TRPCRouter } from './trpc.router';
import { AuthModule } from '../auth/auth.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { PharmacyModule } from '../pharmacy/pharmacy.module';
import { LlmModule } from '../llm/llm.module';
import { AdminModule } from '../admin/admin.module';
import { PatientsModule } from '../patients/patients.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { HealthMetricsModule } from '../health-metrics/health-metrics.module';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [
    AuthModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    PrescriptionsModule,
    PharmacyModule,
    LlmModule,
    AdminModule,
    NotificationsModule,
    HealthMetricsModule,
    AvailabilityModule,
  ],
  providers: [TRPCService, TRPCRouter],
  exports: [TRPCService, TRPCRouter],
})
export class TRPCModule {}
