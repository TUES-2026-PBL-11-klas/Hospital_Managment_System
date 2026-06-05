import { Injectable, OnModuleInit } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import * as express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { router } from '@medinest/trpc';
import { TRPCService } from './trpc.service';
import { AuthService } from '../auth/auth.service';
import { PatientsService } from '../patients/patients.service';
import { DoctorsService } from '../doctors/doctors.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
import { PharmacyService } from '../pharmacy/pharmacy.service';
import { LlmService } from '../llm/llm.service';
import { AdminService } from '../admin/admin.service';
import { NotificationsService } from '../notifications/notifications.service';
import { HealthMetricsService } from '../health-metrics/health-metrics.service';
import { AvailabilityService } from '../availability/availability.service';
import { TRPCError } from '@trpc/server';
import {
  publicProcedure,
  protectedProcedure,
  doctorProcedure,
  pharmacistProcedure,
  adminProcedure,
  patientProcedure,
  registerSchema,
  loginSchema,
  updatePatientProfileSchema,
  getDoctorsBySpecialtySchema,
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  getAppointmentByIdSchema,
  createDiagnosisSchema,
  getByAppointmentSchema,
  createPrescriptionSchema,
  updatePrescriptionStatusSchema,
  getByPatientSchema,
  updateStockSchema,
  dispensePrescriptionSchema,
  addInventorySchema,
  analyzeSymptomSchema,
  getSymptomHistorySchema,
  logHealthMetricSchema,
  getHealthMetricsSchema,
  setAvailabilitySchema,
  deleteAvailabilitySchema,
  getAvailableSlotsSchema,
  markNotificationReadSchema,
  markAllReadSchema,
} from '@medinest/trpc';
import { z } from 'zod';

@Injectable()
export class TRPCRouter implements OnModuleInit {
  constructor(
    private readonly trpcService: TRPCService,
    private readonly authService: AuthService,
    private readonly patientsService: PatientsService,
    private readonly doctorsService: DoctorsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly prescriptionsService: PrescriptionsService,
    private readonly pharmacyService: PharmacyService,
    private readonly llmService: LlmService,
    private readonly adminService: AdminService,
    private readonly notificationsService: NotificationsService,
    private readonly healthMetricsService: HealthMetricsService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  onModuleInit() {}

  appRouter() {
    const authRouter = router({
      register: publicProcedure
        .input(registerSchema)
        .mutation(({ input }) => this.authService.register(input.email, input.password, input.role)),

      login: publicProcedure
        .input(loginSchema)
        .mutation(({ input }) => this.authService.login(input.email, input.password)),

      me: protectedProcedure.query(({ ctx }) => ctx.user),
    });

    const patientRouter = router({
      getProfile: protectedProcedure.query(({ ctx }) =>
        this.patientsService.getProfile(ctx.user!.id),
      ),

      updateProfile: protectedProcedure
        .input(updatePatientProfileSchema)
        .mutation(({ ctx, input }) =>
          this.patientsService.updateProfile(ctx.user!.id, input),
        ),

      getAppointments: protectedProcedure.query(({ ctx }) =>
        this.patientsService.getAppointments(ctx.user!.id),
      ),

      getPrescriptions: protectedProcedure.query(({ ctx }) =>
        this.patientsService.getPrescriptions(ctx.user!.id),
      ),
    });

    const doctorRouter = router({
      getSchedule: protectedProcedure.query(({ ctx }) =>
        this.doctorsService.getSchedule(ctx.user!.id),
      ),

      getPatients: doctorProcedure.query(({ ctx }) =>
        this.doctorsService.getPatients(ctx.user!.id),
      ),

      getDoctors: publicProcedure
        .input(getDoctorsBySpecialtySchema.optional())
        .query(({ input }) => this.doctorsService.getDoctors(input?.specialty)),
    });

    const appointmentRouter = router({
      create: protectedProcedure
        .input(createAppointmentSchema)
        .mutation(({ input }) => this.appointmentsService.create(input)),

      cancel: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(({ input }) => this.appointmentsService.cancel(input.id)),

      updateStatus: doctorProcedure
        .input(updateAppointmentStatusSchema)
        .mutation(({ input }) => this.appointmentsService.updateStatus(input.id, input.status)),

      getById: protectedProcedure
        .input(getAppointmentByIdSchema)
        .query(({ input }) => this.appointmentsService.getById(input.id)),

      getTimeline: protectedProcedure.query(({ ctx }) =>
        this.appointmentsService.getTimeline(ctx.user!.id),
      ),
    });

    const diagnosisRouter = router({
      create: doctorProcedure
        .input(createDiagnosisSchema)
        .mutation(({ input }) => this.appointmentsService.createDiagnosis(input)),

      getByAppointment: protectedProcedure
        .input(getByAppointmentSchema)
        .query(({ input }) => this.appointmentsService.getDiagnosisByAppointment(input.appointmentId)),
    });

    const prescriptionRouter = router({
      create: doctorProcedure
        .input(createPrescriptionSchema)
        .mutation(({ input }) => this.prescriptionsService.create(input)),

      updateStatus: pharmacistProcedure
        .input(updatePrescriptionStatusSchema)
        .mutation(({ input }) => this.prescriptionsService.updateStatus(input.id, input.status)),

      getByPatient: protectedProcedure
        .input(getByPatientSchema)
        .query(({ input }) => this.prescriptionsService.getByPatient(input.patientId)),
    });

    const pharmacyRouter = router({
      getInventory: pharmacistProcedure.query(() => this.pharmacyService.getInventory()),

      updateStock: pharmacistProcedure
        .input(updateStockSchema)
        .mutation(({ input }) =>
          this.pharmacyService.updateStock(input.inventoryId, input.quantity),
        ),

      dispensePrescription: pharmacistProcedure
        .input(dispensePrescriptionSchema)
        .mutation(({ input }) => this.pharmacyService.dispensePrescription(input.prescriptionId)),

      addInventory: pharmacistProcedure
        .input(addInventorySchema)
        .mutation(({ ctx, input }) => this.pharmacyService.addInventory(ctx.user!.id, input)),
    });

    const symptomRouter = router({
      analyze: protectedProcedure
        .input(analyzeSymptomSchema)
        .mutation(({ ctx, input }) =>
          this.llmService.analyzeSymptoms(ctx.user!.id, input),
        ),

      getHistory: protectedProcedure
        .input(getSymptomHistorySchema)
        .query(({ input }) => this.llmService.getSymptomHistory(input.patientId)),
    });

    const adminRouter = router({
      getStats: adminProcedure.query(() => this.adminService.getStats()),

      manageUsers: adminProcedure
        .input(
          z.object({
            action: z.enum(['list', 'deactivate']),
            userId: z.string().uuid().optional(),
          }),
        )
        .mutation(({ input }) => this.adminService.manageUsers(input.action, input.userId)),
    });

    const notificationsRouter = router({
      getAll: protectedProcedure.query(({ ctx }) => {
        // We need the patient record for this user
        return this.notificationsService.getForUser(ctx.user!.id);
      }),

      getUnreadCount: protectedProcedure.query(({ ctx }) =>
        this.notificationsService.getUnreadCountForUser(ctx.user!.id),
      ),

      markRead: protectedProcedure
        .input(markNotificationReadSchema)
        .mutation(({ input }) => this.notificationsService.markRead(input.id)),

      markAllRead: protectedProcedure.mutation(({ ctx }) =>
        this.notificationsService.markAllReadForUser(ctx.user!.id),
      ),
    });

    const healthMetricsRouter = router({
      log: protectedProcedure
        .input(logHealthMetricSchema)
        .mutation(({ ctx, input }) => this.healthMetricsService.log(ctx.user!.id, input)),

      getMetrics: protectedProcedure
        .input(getHealthMetricsSchema)
        .query(({ ctx, input }) => this.healthMetricsService.getMetrics(ctx.user!.id, input)),

      delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(({ input }) => this.healthMetricsService.deleteMetric(input.id)),
    });

    const availabilityRouter = router({
      set: doctorProcedure
        .input(setAvailabilitySchema)
        .mutation(({ ctx, input }) => this.availabilityService.setAvailability(ctx.user!.id, input)),

      getMine: doctorProcedure.query(({ ctx }) =>
        this.availabilityService.getMyAvailability(ctx.user!.id),
      ),

      delete: doctorProcedure
        .input(deleteAvailabilitySchema)
        .mutation(({ input }) => this.availabilityService.deleteAvailability(input.id)),

      getSlots: protectedProcedure
        .input(getAvailableSlotsSchema)
        .query(({ input }) => this.availabilityService.getAvailableSlots(input)),
    });

    return router({
      auth: authRouter,
      patient: patientRouter,
      doctor: doctorRouter,
      appointment: appointmentRouter,
      diagnosis: diagnosisRouter,
      prescription: prescriptionRouter,
      pharmacy: pharmacyRouter,
      symptom: symptomRouter,
      admin: adminRouter,
      notification: notificationsRouter,
      healthMetric: healthMetricsRouter,
      availability: availabilityRouter,
    });
  }

  applyMiddleware(app: INestApplication) {
    app.use('/trpc', express.json());
    app.use(
      '/trpc',
      trpcExpress.createExpressMiddleware({
        router: this.appRouter(),
        createContext: ({ req, res }) => this.trpcService.createContext(req, res),
      }),
    );
  }
}

export type AppRouter = ReturnType<TRPCRouter['appRouter']>;
