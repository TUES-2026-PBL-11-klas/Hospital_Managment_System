'use client';

import { trpc } from '@/lib/trpc';

export default function PharmacistDashboard() {
  const { data: inventory, isLoading } = trpc.pharmacy.getInventory.useQuery();
  const utils = trpc.useUtils();

  const updateStock = trpc.pharmacy.updateStock.useMutation({
    onSuccess: () => utils.pharmacy.getInventory.invalidate(),
  });

  const lowStock = inventory?.filter((i) => i.quantity < 10);
  const expiringSoon = inventory?.filter((i) => {
    const days = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Инвентар на аптеката</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="text-3xl font-bold text-blue-700">{inventory?.length ?? 0}</div>
          <div className="text-sm text-blue-600 mt-1">Позиции в инвентара</div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="text-3xl font-bold text-red-700">{lowStock?.length ?? 0}</div>
          <div className="text-sm text-red-600 mt-1">Малко количество ({'<'}10)</div>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="text-3xl font-bold text-yellow-700">{expiringSoon?.length ?? 0}</div>
          <div className="text-sm text-yellow-600 mt-1">Изтичат скоро (30 дни)</div>
        </div>
      </div>

      {(lowStock?.length ?? 0) > 0 && (
        <div className="card border-red-200 bg-red-50">
          <h2 className="font-semibold text-red-700 mb-3">Критично ниски наличности</h2>
          <div className="space-y-2">
            {lowStock?.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div>
                  <span className="font-medium">{item.medication.name}</span>
                  <span className="text-red-600 ml-2 font-bold">{item.quantity} бр.</span>
                </div>
                <span className="text-xs text-gray-400">Партида: {item.batchNumber}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Всички медикаменти</h2>
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Зареждане...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 font-medium text-gray-500">Медикамент</th>
                  <th className="pb-3 font-medium text-gray-500">Категория</th>
                  <th className="pb-3 font-medium text-gray-500">Количество</th>
                  <th className="pb-3 font-medium text-gray-500">Срок</th>
                  <th className="pb-3 font-medium text-gray-500">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory?.map((item) => {
                  const daysLeft = Math.ceil(
                    (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                  );
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <div className="font-medium">{item.medication.name}</div>
                        <div className="text-xs text-gray-400">{item.medication.genericName}</div>
                      </td>
                      <td className="py-3 text-gray-500">{item.medication.category}</td>
                      <td className="py-3">
                        <span className={item.quantity < 10 ? 'text-red-600 font-bold' : ''}>
                          {item.quantity} {item.medication.unit}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={daysLeft <= 30 ? 'text-yellow-600' : 'text-gray-500'}>
                          {new Date(item.expiryDate).toLocaleDateString('bg-BG')}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => {
                            const qty = prompt('Ново количество:', String(item.quantity));
                            if (qty && !isNaN(Number(qty))) {
                              updateStock.mutate({ inventoryId: item.id, quantity: Number(qty) });
                            }
                          }}
                          className="text-primary-600 hover:underline text-xs"
                        >
                          Редактирай
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
