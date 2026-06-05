'use client';

import { trpc } from '@/lib/trpc';

const STATUS_BADGES: Record<string, string> = {
  ISSUED: 'badge-scheduled',
  DISPENSED: 'badge-completed',
  EXPIRED: 'badge-cancelled',
  CANCELLED: 'badge-cancelled',
};

export default function PrescriptionsPage() {
  const { data: prescriptions, isLoading } = trpc.patient.getPrescriptions.useQuery();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Моите рецепти</h1>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Зареждане...</div>
      ) : prescriptions?.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-2">💊</div>
          <p className="text-gray-400">Нямате издадени рецепти</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions?.map((rx) => (
            <div key={rx.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-semibold">
                    Рецепта от {new Date(rx.issuedAt).toLocaleDateString('bg-BG')}
                  </div>
                  <div className="text-sm text-gray-500">
                    Валидна до {new Date(rx.validUntil).toLocaleDateString('bg-BG')}
                  </div>
                </div>
                <span className={STATUS_BADGES[rx.status] ?? 'badge-scheduled'}>{rx.status}</span>
              </div>

              <div className="space-y-2">
                {rx.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{item.medication.name}</div>
                      <div className="text-xs text-gray-500">{item.medication.genericName}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{item.dosage}</div>
                      <div className="text-gray-500 text-xs">{item.frequency} · {item.durationDays} дни</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
