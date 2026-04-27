'use client';

import type { CallFilter } from '@/lib/types';

interface Props {
  active: CallFilter;
  counts: Record<CallFilter, number>;
  onChange: (f: CallFilter) => void;
}

const TABS: { id: CallFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'completed', label: 'Completadas' },
  { id: 'with-analysis', label: 'Com análise' },
  { id: 'voicemail', label: 'Caixa postal' },
  { id: 'no-answer', label: 'Sem resposta' },
];

export function FilterTabs({ active, counts, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              isActive
                ? 'bg-navy-900 text-white border-navy-900'
                : 'bg-white text-navy-700 border-navy-200 hover:border-navy-400'
            }`}
          >
            {tab.label} ({counts[tab.id]})
          </button>
        );
      })}
    </div>
  );
}
