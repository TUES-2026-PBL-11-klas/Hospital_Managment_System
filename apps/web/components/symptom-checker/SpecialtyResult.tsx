'use client';

import { useState } from 'react';

interface Doctor {
  id: string;
  specialty: string;
  department: string;
  user: { email: string };
}

interface SymptomCheck {
  id: string;
  suggestedSpecialty: string;
  confidenceScore: number;
  llmReasoning: unknown;
  symptomsText: string;
}

interface SpecialtyResultProps {
  symptomCheck: SymptomCheck;
  availableDoctors: Doctor[];
  onBookAppointment: (doctorId: string, specialty: string) => void;
}

export function SpecialtyResult({ symptomCheck, availableDoctors, onBookAppointment }: SpecialtyResultProps) {
  const confidence = Math.round(symptomCheck.confidenceScore * 100);
  const reasoning = typeof symptomCheck.llmReasoning === 'object' && symptomCheck.llmReasoning !== null
    ? (symptomCheck.llmReasoning as Record<string, string>).reasoning
    : '';

  const confidenceColor =
    confidence >= 80 ? 'bg-green-500' :
    confidence >= 60 ? 'bg-yellow-500' :
    'bg-red-500';

  return (
    <div className="space-y-6">
      <div className="card border-primary-200 bg-primary-50">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-primary-600 font-medium">Препоръчана специалност</div>
            <div className="text-2xl font-bold text-primary-900 mt-1">
              {symptomCheck.suggestedSpecialty}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Увереност</div>
            <div className="text-2xl font-bold text-gray-900">{confidence}%</div>
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${confidenceColor} h-2 rounded-full transition-all`}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        {reasoning && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-primary-100">
            <div className="text-xs font-medium text-gray-500 mb-1">AI обяснение</div>
            <p className="text-sm text-gray-700">{reasoning}</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          Достъпни лекари — {symptomCheck.suggestedSpecialty}
        </h3>

        {availableDoctors.length === 0 ? (
          <div className="card text-center text-gray-400 py-6">
            <div className="text-3xl mb-2">👨‍⚕️</div>
            <p>Няма налични лекари по тази специалност</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {availableDoctors.map((doctor) => (
              <div key={doctor.id} className="card flex items-center justify-between">
                <div>
                  <div className="font-medium">{doctor.user.email}</div>
                  <div className="text-sm text-gray-500">{doctor.specialty}</div>
                  <div className="text-xs text-gray-400">{doctor.department}</div>
                </div>
                <button
                  onClick={() => onBookAppointment(doctor.id, doctor.specialty)}
                  className="btn-primary text-sm"
                >
                  Запиши час
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
