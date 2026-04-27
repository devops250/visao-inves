import type { DashboardStats } from '@/lib/types';
import { formatDateRange } from '@/lib/format';

interface Props {
  stats: DashboardStats;
}

interface CardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'navy' | 'red' | 'emerald' | 'amber';
}

function StatCard({ label, value, sub, accent = 'navy' }: CardProps) {
  const colorMap = {
    navy: 'text-navy-600',
    red: 'text-red-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
  };
  return (
    <div className="bg-white rounded-xl border border-navy-100 p-4 shadow-sm hover:shadow transition-shadow">
      <div className="text-[10px] uppercase tracking-wider text-navy-400 font-medium">
        {label}
      </div>
      <div className={`mt-2 text-2xl sm:text-3xl font-semibold ${colorMap[accent]}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-navy-500">{sub}</div>}
    </div>
  );
}

export function StatsCards({ stats }: Props) {
  const periodLabel = formatDateRange(stats.periodStart, stats.periodEnd);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      <StatCard
        label="Total ligações"
        value={stats.total}
        sub={`Período ${periodLabel}`}
      />
      <StatCard
        label="Completadas"
        value={stats.completed}
        sub={`${stats.completionRate.toFixed(1)}% conectaram`}
        accent="emerald"
      />
      <StatCard label="Com análise IA" value={stats.withAnalysis} accent="navy" />
      <StatCard label="Caixa postal" value={stats.voicemail} accent="amber" />
      <StatCard label="Período" value={periodLabel} sub="dia inicial – final" />
      <StatCard label="Sem resposta" value={stats.noAnswer} accent="red" />
    </div>
  );
}
