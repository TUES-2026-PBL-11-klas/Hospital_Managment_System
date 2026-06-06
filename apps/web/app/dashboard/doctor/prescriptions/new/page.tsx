'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

interface PrescriptionItemForm {
  medicationId: string;
  dosage: string;
  frequency: string;
  durationDays: number;
}

export default function NewPrescriptionPage() {
  const router = useRouter();
  const { data: schedule } = trpc.doctor.getSchedule.useQuery();
  const [diagnosisId, setDiagnosisId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<PrescriptionItemForm[]>([
    { medicationId: '', dosage: '', frequency: '', durationDays: 7 },
  ]);
  const [error, setError] = useState('');

  const createMutation = trpc.prescription.create.useMutation({
    onSuccess() {
      router.push('/dashboard/doctor');
    },
    onError(err) {
      setError(err.message);
    },
  });

  const completedAppointments = schedule?.filter((a) => a.status === 'COMPLETED' && a.diagnosis);

  const addItem = () => {
    setItems([...items, { medicationId: '', dosage: '', frequency: '', durationDays: 7 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PrescriptionItemForm, value: string | number) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!diagnosisId || !validUntil) {
      setError('Моля, попълнете всички задължителни полета');
      return;
    }

    createMutation.mutate({
      diagnosisId,
      validUntil: new Date(validUntil).toISOString(),
      items: items.map((item) => ({
        ...item,
        durationDays: Number(item.durationDays),
      })),
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Нова рецепта</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="card space-y-4">
          <h2 className="font-semibold">Диагноза</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Изберете диагноза (от завършени часове)
            </label>
            <select
              className="input"
              value={diagnosisId}
              onChange={(e) => setDiagnosisId(e.target.value)}
              required
            >
              <option value="">-- Изберете --</option>
              {completedAppointments?.map((apt) => (
                <option key={apt.diagnosis!.id} value={apt.diagnosis!.id}>
                  {apt.patient.user.email} — {apt.diagnosis!.icdCode}: {apt.diagnosis!.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Валидна до</label>
            <input
              type="date"
              className="input"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Медикаменти</h2>
            <button type="button" onClick={addItem} className="btn-secondary text-sm">
              + Добави
            </button>
          </div>

          {items.map((item, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Медикамент {index + 1}</span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Премахни
                  </button>
                )}
              </div>
              <input
                className="input"
                placeholder="ID на медикамент"
                value={item.medicationId}
                onChange={(e) => updateItem(index, 'medicationId', e.target.value)}
                required
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  className="input"
                  placeholder="Доза (напр. 500mg)"
                  value={item.dosage}
                  onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                  required
                />
                <input
                  className="input"
                  placeholder="Честота (напр. 3x дневно)"
                  value={item.frequency}
                  onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                  required
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Дни"
                  min={1}
                  value={item.durationDays}
                  onChange={(e) => updateItem(index, 'durationDays', parseInt(e.target.value))}
                  required
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Записване...' : 'Издай рецепта'}
        </button>
      </form>
    </div>
  );
}
