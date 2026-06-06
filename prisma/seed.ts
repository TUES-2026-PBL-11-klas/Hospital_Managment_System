import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // ── Users ──────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@medinest.bg' },
    update: {},
    create: { email: 'admin@medinest.bg', passwordHash: await hash('Admin1234!'), role: 'ADMIN' },
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: 'dr.petrov@medinest.bg' },
    update: {},
    create: { email: 'dr.petrov@medinest.bg', passwordHash: await hash('Doctor1234!'), role: 'DOCTOR' },
  });

  const doctorUser2 = await prisma.user.upsert({
    where: { email: 'dr.ivanova@medinest.bg' },
    update: {},
    create: { email: 'dr.ivanova@medinest.bg', passwordHash: await hash('Doctor1234!'), role: 'DOCTOR' },
  });

  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@medinest.bg' },
    update: {},
    create: { email: 'patient@medinest.bg', passwordHash: await hash('Patient1234!'), role: 'PATIENT' },
  });

  const pharmacistUser = await prisma.user.upsert({
    where: { email: 'pharmacist@medinest.bg' },
    update: {},
    create: { email: 'pharmacist@medinest.bg', passwordHash: await hash('Pharmacy1234!'), role: 'PHARMACIST' },
  });

  // ── Profiles ────────────────────────────────────────────────────────
  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      specialty: 'Кардиология',
      licenseNumber: 'BG-DOC-00001',
      department: 'Кардиологично отделение',
    },
  });

  const doctor2 = await prisma.doctor.upsert({
    where: { userId: doctorUser2.id },
    update: {},
    create: {
      userId: doctorUser2.id,
      specialty: 'Неврология',
      licenseNumber: 'BG-DOC-00002',
      department: 'Неврологично отделение',
    },
  });

  const patient = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      egn: '9001011234',
      dateOfBirth: new Date('1990-01-01'),
      insuranceNumber: 'NHIF-123456',
      address: 'ул. Витоша 1, София',
    },
  });

  const pharmacist = await prisma.pharmacist.upsert({
    where: { userId: pharmacistUser.id },
    update: {},
    create: {
      userId: pharmacistUser.id,
      licenseNumber: 'BG-PHARM-00001',
    },
  });

  // ── Medications ─────────────────────────────────────────────────────
  const medications = await Promise.all([
    prisma.medication.upsert({
      where: { id: 'med-0001-0000-0000-000000000001' },
      update: {},
      create: { id: 'med-0001-0000-0000-000000000001', name: 'Аспирин', genericName: 'Acetylsalicylic acid', unit: 'mg', category: 'Аналгетик' },
    }),
    prisma.medication.upsert({
      where: { id: 'med-0002-0000-0000-000000000002' },
      update: {},
      create: { id: 'med-0002-0000-0000-000000000002', name: 'Амоксицилин', genericName: 'Amoxicillin', unit: 'mg', category: 'Антибиотик' },
    }),
    prisma.medication.upsert({
      where: { id: 'med-0003-0000-0000-000000000003' },
      update: {},
      create: { id: 'med-0003-0000-0000-000000000003', name: 'Ибупрофен', genericName: 'Ibuprofen', unit: 'mg', category: 'НСПВС' },
    }),
    prisma.medication.upsert({
      where: { id: 'med-0004-0000-0000-000000000004' },
      update: {},
      create: { id: 'med-0004-0000-0000-000000000004', name: 'Метформин', genericName: 'Metformin', unit: 'mg', category: 'Антидиабетик' },
    }),
    prisma.medication.upsert({
      where: { id: 'med-0005-0000-0000-000000000005' },
      update: {},
      create: { id: 'med-0005-0000-0000-000000000005', name: 'Омепразол', genericName: 'Omeprazole', unit: 'mg', category: 'ИПП' },
    }),
  ]);

  // ── Inventory ────────────────────────────────────────────────────────
  for (const med of medications) {
    await prisma.inventory.create({
      data: {
        medicationId: med.id,
        pharmacistId: pharmacist.id,
        batchNumber: `BATCH-${med.id.slice(-4)}-2024`,
        quantity: 100,
        expiryDate: new Date('2026-12-31'),
      },
    });
  }

  // ── Sample appointment ───────────────────────────────────────────────
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'SCHEDULED',
      notes: 'Рутинен преглед',
    },
  });

  console.log('✓ Seed complete.');
  console.log('\nDemo credentials:');
  console.log('  Admin:      admin@medinest.bg      / Admin1234!');
  console.log('  Doctor:     dr.petrov@medinest.bg  / Doctor1234!');
  console.log('  Doctor 2:   dr.ivanova@medinest.bg / Doctor1234!');
  console.log('  Patient:    patient@medinest.bg    / Patient1234!');
  console.log('  Pharmacist: pharmacist@medinest.bg / Pharmacy1234!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
