-- MediNest Database Init Script
-- Generated for PostgreSQL 14+
-- Run: psql -U postgres -d medinest -f prisma/init.sql
-- Or via Docker: docker exec -i medinest-postgres-1 psql -U postgres -d medinest < prisma/init.sql

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'PATIENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PrescriptionStatus" AS ENUM ('ISSUED', 'DISPENSED', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "User" (
  "id"           TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "email"        TEXT         NOT NULL,
  "passwordHash" TEXT         NOT NULL,
  "role"         "Role"       NOT NULL,
  "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_email_key" UNIQUE ("email")
);

CREATE TABLE IF NOT EXISTS "Patient" (
  "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"          TEXT        NOT NULL,
  "egn"             TEXT        NOT NULL,
  "dateOfBirth"     TIMESTAMPTZ NOT NULL,
  "insuranceNumber" TEXT,
  "address"         TEXT,

  CONSTRAINT "Patient_pkey"   PRIMARY KEY ("id"),
  CONSTRAINT "Patient_userId_key" UNIQUE ("userId"),
  CONSTRAINT "Patient_egn_key"    UNIQUE ("egn"),
  CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Doctor" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"        TEXT NOT NULL,
  "specialty"     TEXT NOT NULL,
  "licenseNumber" TEXT NOT NULL,
  "department"    TEXT NOT NULL,

  CONSTRAINT "Doctor_pkey"             PRIMARY KEY ("id"),
  CONSTRAINT "Doctor_userId_key"       UNIQUE ("userId"),
  CONSTRAINT "Doctor_licenseNumber_key" UNIQUE ("licenseNumber"),
  CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Nurse" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"     TEXT NOT NULL,
  "department" TEXT NOT NULL,

  CONSTRAINT "Nurse_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "Nurse_userId_key" UNIQUE ("userId"),
  CONSTRAINT "Nurse_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Pharmacist" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"        TEXT NOT NULL,
  "licenseNumber" TEXT NOT NULL,

  CONSTRAINT "Pharmacist_pkey"             PRIMARY KEY ("id"),
  CONSTRAINT "Pharmacist_userId_key"       UNIQUE ("userId"),
  CONSTRAINT "Pharmacist_licenseNumber_key" UNIQUE ("licenseNumber"),
  CONSTRAINT "Pharmacist_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Appointment" (
  "id"          TEXT                NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId"   TEXT                NOT NULL,
  "doctorId"    TEXT                NOT NULL,
  "scheduledAt" TIMESTAMPTZ         NOT NULL,
  "status"      "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "notes"       TEXT,

  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId")
    REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId")
    REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Diagnosis" (
  "id"            TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "appointmentId" TEXT        NOT NULL,
  "icdCode"       TEXT        NOT NULL,
  "description"   TEXT        NOT NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "Diagnosis_pkey"             PRIMARY KEY ("id"),
  CONSTRAINT "Diagnosis_appointmentId_key" UNIQUE ("appointmentId"),
  CONSTRAINT "Diagnosis_appointmentId_fkey" FOREIGN KEY ("appointmentId")
    REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Prescription" (
  "id"          TEXT                NOT NULL DEFAULT gen_random_uuid()::text,
  "diagnosisId" TEXT                NOT NULL,
  "issuedAt"    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  "validUntil"  TIMESTAMPTZ         NOT NULL,
  "status"      "PrescriptionStatus" NOT NULL DEFAULT 'ISSUED',

  CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Prescription_diagnosisId_fkey" FOREIGN KEY ("diagnosisId")
    REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Medication" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT NOT NULL,
  "genericName" TEXT NOT NULL,
  "unit"        TEXT NOT NULL,
  "category"    TEXT NOT NULL,

  CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PrescriptionItem" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "prescriptionId" TEXT NOT NULL,
  "medicationId"   TEXT NOT NULL,
  "dosage"         TEXT NOT NULL,
  "frequency"      TEXT NOT NULL,
  "durationDays"   INTEGER NOT NULL,

  CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId")
    REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PrescriptionItem_medicationId_fkey" FOREIGN KEY ("medicationId")
    REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Inventory" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "medicationId" TEXT        NOT NULL,
  "pharmacistId" TEXT        NOT NULL,
  "batchNumber"  TEXT        NOT NULL,
  "quantity"     INTEGER     NOT NULL,
  "expiryDate"   TIMESTAMPTZ NOT NULL,

  CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Inventory_medicationId_fkey" FOREIGN KEY ("medicationId")
    REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Inventory_pharmacistId_fkey" FOREIGN KEY ("pharmacistId")
    REFERENCES "Pharmacist"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SymptomCheck" (
  "id"                 TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId"          TEXT        NOT NULL,
  "appointmentId"      TEXT,
  "symptomsText"       TEXT        NOT NULL,
  "suggestedSpecialty" TEXT        NOT NULL,
  "confidenceScore"    DOUBLE PRECISION NOT NULL,
  "llmReasoning"       JSONB       NOT NULL,
  "modelVersion"       TEXT        NOT NULL,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "SymptomCheck_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SymptomCheck_patientId_fkey" FOREIGN KEY ("patientId")
    REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SymptomCheck_appointmentId_fkey" FOREIGN KEY ("appointmentId")
    REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "LlmTrainingData" (
  "id"               TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "symptomsText"     TEXT        NOT NULL,
  "correctSpecialty" TEXT        NOT NULL,
  "verifiedByDoctor" BOOLEAN     NOT NULL DEFAULT FALSE,
  "verifiedBy"       TEXT,
  "dataSource"       TEXT        NOT NULL,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "LlmTrainingData_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LlmTrainingData_verifiedBy_fkey" FOREIGN KEY ("verifiedBy")
    REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────
-- INDEXES (performance)
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_appointment_patientId"   ON "Appointment"("patientId");
CREATE INDEX IF NOT EXISTS "idx_appointment_doctorId"    ON "Appointment"("doctorId");
CREATE INDEX IF NOT EXISTS "idx_appointment_scheduledAt" ON "Appointment"("scheduledAt");
CREATE INDEX IF NOT EXISTS "idx_appointment_status"      ON "Appointment"("status");

CREATE INDEX IF NOT EXISTS "idx_prescription_diagnosisId" ON "Prescription"("diagnosisId");
CREATE INDEX IF NOT EXISTS "idx_prescriptionItem_prescriptionId" ON "PrescriptionItem"("prescriptionId");

CREATE INDEX IF NOT EXISTS "idx_inventory_medicationId" ON "Inventory"("medicationId");
CREATE INDEX IF NOT EXISTS "idx_inventory_expiryDate"   ON "Inventory"("expiryDate");

CREATE INDEX IF NOT EXISTS "idx_symptomCheck_patientId" ON "SymptomCheck"("patientId");
CREATE INDEX IF NOT EXISTS "idx_symptomCheck_createdAt" ON "SymptomCheck"("createdAt");

CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");

-- ─────────────────────────────────────────────
-- SEED: Admin user (password: Admin1234!)
-- bcrypt hash of "Admin1234!" with 12 rounds
-- ─────────────────────────────────────────────
INSERT INTO "User" ("id", "email", "passwordHash", "role")
VALUES (
  'admin-seed-0000-0000-000000000000',
  'admin@medinest.bg',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewFHOkyLJjSddxmy',
  'ADMIN'
) ON CONFLICT DO NOTHING;

-- Seed medications
INSERT INTO "Medication" ("id", "name", "genericName", "unit", "category") VALUES
  ('med-0001-0000-0000-000000000001', 'Аспирин', 'Acetylsalicylic acid', 'mg', 'Аналгетик'),
  ('med-0002-0000-0000-000000000002', 'Амоксицилин', 'Amoxicillin', 'mg', 'Антибиотик'),
  ('med-0003-0000-0000-000000000003', 'Ибупрофен', 'Ibuprofen', 'mg', 'НСПВС'),
  ('med-0004-0000-0000-000000000004', 'Метформин', 'Metformin', 'mg', 'Антидиабетик'),
  ('med-0005-0000-0000-000000000005', 'Омепразол', 'Omeprazole', 'mg', 'Инхибитор на протонната помпа')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- Prisma migrations table (so Prisma recognises the schema as migrated)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                   VARCHAR(36)  NOT NULL,
  "checksum"             VARCHAR(64)  NOT NULL,
  "finished_at"          TIMESTAMPTZ,
  "migration_name"       VARCHAR(255) NOT NULL,
  "logs"                 TEXT,
  "rolled_back_at"       TIMESTAMPTZ,
  "started_at"           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "applied_steps_count"  INTEGER      NOT NULL DEFAULT 0,

  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations"
  ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
VALUES
  (
    gen_random_uuid()::text,
    'manual-init',
    NOW(),
    '20240101000000_init',
    1
  )
ON CONFLICT DO NOTHING;
