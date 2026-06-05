'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { getUser } from '@/lib/auth';
import { SymptomInput } from '@/components/symptom-checker/SymptomInput';
import { SpecialtyResult } from '@/components/symptom-checker/SpecialtyResult';

export default function SymptomCheckPage() {
  const router = useRouter();
  const [result, setResult] = useState<Awaited<ReturnType<typeof analyzeMutation.mutateAsync>> | null>(null);
  const [bookingDoctorId, setBookingDoctorId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');

  const analyzeMutation = trpc.symptom.analyze.useMutation({
    onSuccess(data) {
      setResult(data);
    },
  });

  const bookMutation = trpc.appointment.create.useMutation({
    onSuccess() {
      router.push('/dashboard/patient');
    },
  });

  const user = getUser();

  const handleBook = (doctorId: string) => {
    setBookingDoctorId(doctorId);
  };

  const confirmBooking = () => {
    if (!user || !bookingDoctorId || !scheduledAt) return;
    const patient = result?.symptomCheck.patientId;
    bookMutation.mutate({
      patientId: patient!,
      doctorId: bookingDoctorId,
      scheduledAt: new Date(scheduledAt).toISOString(),
      notes: result?.symptomCheck.symptomsText,
    });
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Проверка на симптоми</h1>
        <p className="text-gray-500 text-sm mt-1">
          Опишете симптомите си на български и нашият AI ще предложи подходяща специалност
        </p>
      </div>

      {!result ? (
        <div className="card">
          <SymptomInput
            onSubmit={(text) => analyzeMutation.mutate({ symptomsText: text })}
            isLoading={analyzeMutation.isPending}
          />
          {analyzeMutation.isError && (
            <div className="mt-4 text-sm text-red-600">{analyzeMutation.error.message}</div>
          )}
        </div>
      ) : (
        <>
          <SpecialtyResult
            symptomCheck={result.symptomCheck}
            availableDoctors={result.availableDoctors as never}
            onBookAppointment={handleBook}
          />

          {bookingDoctorId && (
            <div className="card mt-6">
              <h3 className="font-semibold mb-3">Изберете дата и час</h3>
              <input
                type="datetime-local"
                className="input mb-3"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <div className="flex gap-2">
                <button
                  onClick={confirmBooking}
                  className="btn-primary"
                  disabled={!scheduledAt || bookMutation.isPending}
                >
                  {bookMutation.isPending ? 'Записване...' : 'Потвърди час'}
                </button>
                <button
                  onClick={() => setBookingDoctorId(null)}
                  className="btn-secondary"
                >
                  Отказ
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => { setResult(null); setBookingDoctorId(null); }}
            className="btn-secondary mt-4"
          >
            Нова проверка
          </button>
        </>
      )}
    </div>
  );
}
