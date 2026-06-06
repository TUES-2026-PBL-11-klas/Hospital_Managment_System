'use client';

import { trpc } from '@/lib/trpc';

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Насрочен',
  IN_PROGRESS: 'В процес',
  COMPLETED: 'Завършен',
  CANCELLED: 'Отменен',
};

const STATUS_CLASS: Record<string, string> = {
  SCHEDULED: 'badge-scheduled',
  IN_PROGRESS: 'badge-in-progress',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
};

export default function DoctorDashboard() {
  const { data: schedule, isLoading } = trpc.doctor.getSchedule.useQuery();
  const updateStatus = trpc.appointment.updateStatus.useMutation();
  const utils = trpc.useUtils();

  const handleStatusChange = (id: string, status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => utils.doctor.getSchedule.invalidate(),
    });
  };

  const today = schedule?.filter((a) => {
    const d = new Date(a.scheduledAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">График на лекаря</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="text-3xl font-bold text-blue-700">{today?.length ?? 0}</div>
          <div className="text-sm text-blue-600 mt-1">Часове днес</div>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="text-3xl font-bold text-yellow-700">
            {schedule?.filter((a) => a.status === 'SCHEDULED').length ?? 0}
          </div>
          <div className="text-sm text-yellow-600 mt-1">Предстоящи</div>
        </div>
        <div className="card bg-green-50 border-green-200">
          <div className="text-3xl font-bold text-green-700">
            {schedule?.filter((a) => a.status === 'COMPLETED').length ?? 0}
          </div>
          <div className="text-sm text-green-600 mt-1">Завършени</div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Всички часове</h2>
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Зареждане...</div>
        ) : (schedule?.length ?? 0) === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p>Нямате записани часове</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedule?.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{apt.patient.user.email}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(apt.scheduledAt).toLocaleDateString('bg-BG', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {apt.notes && <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">{apt.notes}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={STATUS_CLASS[apt.status] ?? ''}>{STATUS_LABEL[apt.status]}</span>
                  {apt.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleStatusChange(apt.id, 'IN_PROGRESS')}
                      className="text-xs btn-primary py-1"
                    >
                      Започни
                    </button>
                  )}
                  {apt.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                      className="text-xs btn-primary py-1"
                    >
                      Завърши
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
