'use client';

interface Props {
  from: string;
  to: string;
  minDate: string;
  maxDate: string;
  onChange: (from: string, to: string) => void;
}

function toDateInput(iso: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function PeriodFilter({ from, to, minDate, maxDate, onChange }: Props) {
  const minD = toDateInput(minDate);
  const maxD = toDateInput(maxDate);
  const hasFilter = from !== minD || to !== maxD;

  return (
    <div className="bg-white rounded-xl border border-navy-100 p-4 shadow-sm flex flex-col">
      <div className="text-[10px] uppercase tracking-wider text-navy-400 font-medium">
        Período
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <input
          type="date"
          value={from}
          min={minD}
          max={to || maxD}
          onChange={(e) => onChange(e.target.value, to)}
          className="flex-1 min-w-0 px-1.5 py-1 rounded border border-navy-200 text-navy-800 focus:outline-none focus:border-navy-500"
        />
        <span className="text-navy-400">–</span>
        <input
          type="date"
          value={to}
          min={from || minD}
          max={maxD}
          onChange={(e) => onChange(from, e.target.value)}
          className="flex-1 min-w-0 px-1.5 py-1 rounded border border-navy-200 text-navy-800 focus:outline-none focus:border-navy-500"
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-navy-400">
        <span>filtra a lista</span>
        {hasFilter && (
          <button
            onClick={() => onChange(minD, maxD)}
            className="text-navy-600 hover:text-navy-800 font-medium underline"
          >
            limpar
          </button>
        )}
      </div>
    </div>
  );
}
