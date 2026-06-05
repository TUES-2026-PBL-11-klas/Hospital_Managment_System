'use client';

import { trpc } from '@/lib/trpc';

export default function DoctorAppointmentsPage() {
  const { data: patients, isLoading } = trpc.doctor.getPatients.useQuery();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Моите пациенти</h1>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Зареждане...</div>
      ) : (patients?.length ?? 0) === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-2">👥</div>
          <p className="text-gray-400">Нямате пациенти все още</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {patients?.map((patient) => (
            <div key={patient.id} className="card flex items-center justify-between">
              <div>
                <div className="font-medium">{patient.user.email}</div>
                <div className="text-sm text-gray-500">
                  ЕГН: {patient.egn}
                </div>
                <div className="text-xs text-gray-400">
                  Роден: {new Date(patient.dateOfBirth).toLocaleDateString('bg-BG')}
                </div>
              </div>
              {patient.insuranceNumber && (
                <div className="text-xs text-gray-500">
                  НЗОК: {patient.insuranceNumber}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
