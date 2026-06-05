'use client';

import { useState } from 'react';

interface SymptomInputProps {
  onSubmit: (symptomsText: string) => void;
  isLoading: boolean;
}

export function SymptomInput({ onSubmit, isLoading }: SymptomInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length >= 10) {
      onSubmit(text.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Опишете симптомите си
        </label>
        <textarea
          className="input min-h-[140px] resize-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напр.: Имам главоболие от три дни, придружено с температура около 38°C и болки в гърлото..."
          disabled={isLoading}
        />
        <div className="text-xs text-gray-400 mt-1">
          {text.length < 10 ? `Минимум ${10 - text.length} символа още` : `${text.length} символа`}
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={isLoading || text.trim().length < 10}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Анализиране...
          </span>
        ) : (
          'Анализирай симптоми'
        )}
      </button>
    </form>
  );
}
