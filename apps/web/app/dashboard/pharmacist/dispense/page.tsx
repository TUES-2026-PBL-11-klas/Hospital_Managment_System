'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';

export default function DispensePage() {
  const [prescriptionId, setPrescriptionId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const utils = trpc.useUtils();

  const dispenseMutation = trpc.pharmacy.dispensePrescription.useMutation({
    onSuccess() {
      setMessage({ type: 'success', text: 'Рецептата е отпусната успешно!' });
      setPrescriptionId('');
      utils.pharmacy.getInventory.invalidate();
    },
    onError(err) {
      setMessage({ type: 'error', text: err.message });
    },
  });

  const handleDispense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionId.trim()) return;
    setMessage(null);
    dispenseMutation.mutate({ prescriptionId: prescriptionId.trim() });
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Отпускане на рецепта</h1>

      <div className="card">
        <form onSubmit={handleDispense} className="space-y-4">
          {message && (
            <div className={`px-4 py-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID на рецептата
            </label>
            <input
              type="text"
              className="input"
              value={prescriptionId}
              onChange={(e) => setPrescriptionId(e.target.value)}
              placeholder="Въведете UUID на рецептата"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={dispenseMutation.isPending || !prescriptionId.trim()}
          >
            {dispenseMutation.isPending ? 'Обработка...' : 'Отпусни рецепта'}
          </button>
        </form>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Процес</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Въведете ID на рецептата от пациента</li>
          <li>Системата ще провери наличностите</li>
          <li>Ако има достатъчно количества, рецептата се отпуска</li>
          <li>Инвентарът се актуализира автоматично</li>
        </ol>
      </div>
    </div>
  );
}
