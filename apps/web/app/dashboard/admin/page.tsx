'use client';

import { trpc } from '@/lib/trpc';

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.admin.getStats.useQuery();
  const manageUsers = trpc.admin.manageUsers.useMutation();

  const handleListUsers = () => {
    manageUsers.mutate({ action: 'list' });
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Зареждане...</div>;
  }

  const userList = Array.isArray(manageUsers.data)
    ? (manageUsers.data as { id: string; email: string; role: string; createdAt: string }[])
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Административен панел</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Потребители', value: stats?.totalUsers, color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Пациенти', value: stats?.totalPatients, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Лекари', value: stats?.totalDoctors, color: 'bg-purple-50 border-purple-200 text-purple-700' },
          { label: 'Часове', value: stats?.totalAppointments, color: 'bg-orange-50 border-orange-200 text-orange-700' },
          { label: 'Рецепти', value: stats?.totalPrescriptions, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Насрочени', value: stats?.pendingAppointments, color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
          { label: 'Завършени', value: stats?.completedAppointments, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
        ].map((stat) => (
          <div key={stat.label} className={`card border ${stat.color}`}>
            <div className="text-3xl font-bold">{stat.value ?? 0}</div>
            <div className="text-sm mt-1 opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Управление на потребители</h2>
          <button
            onClick={handleListUsers}
            className="btn-secondary text-sm"
            disabled={manageUsers.isLoading}
          >
            {manageUsers.isLoading ? 'Зареждане...' : 'Зареди потребители'}
          </button>
        </div>

        {userList && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 font-medium text-gray-500">Имейл</th>
                  <th className="pb-3 font-medium text-gray-500">Роля</th>
                  <th className="pb-3 font-medium text-gray-500">Регистриран</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {userList.map((user) => (
                  <tr key={user.id}>
                    <td className="py-3">{user.email}</td>
                    <td className="py-3">
                      <span className="badge-scheduled">{user.role}</span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('bg-BG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
