'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc';

export default function PatientDashboard() {
  const { data: appointments, isLoading } = trpc.patient.getAppointments.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Моят здравен портал</h1>
        <Link href="/dashboard/patient/symptom-check" className="btn-primary">
          Провери симптоми
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-primary-50 border-primary-200">
          <div className="text-3xl font-bold text-primary-700">{appointments?.length ?? 0}</div>
          <div className="text-sm text-primary-600 mt-1">Общо часа</div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="text-3xl font-bold text-green-700">
            {appointments?.filter((a) => a.status === 'SCHEDULED').length ?? 0}
          </div>
          <div className="text-sm text-green-600 mt-1">Предстоящи</div>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="text-3xl font-bold text-yellow-700">
            {appointments?.filter((a) => a.status === 'COMPLETED').length ?? 0}
          </div>
          <div className="text-sm text-yellow-600 mt-1">Завършени</div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Предстоящи часове</h2>
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Зареждане...</div>
        ) : appointments?.filter((a) => a.status === 'SCHEDULED').length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📅</div>
            <p>Нямате предстоящи часове</p>
            <Link href="/dashboard/patient/symptom-check" className="text-primary-600 hover:underline text-sm mt-2 block">
              Проверете симптомите си и запишете час
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments
              ?.filter((a) => a.status === 'SCHEDULED')
              .map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{apt.doctor.user.email}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(apt.scheduledAt).toLocaleDateString('bg-BG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {apt.notes && <div className="text-xs text-gray-400 mt-1">{apt.notes}</div>}
                  </div>
                  <span className="badge-scheduled">{apt.status}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
