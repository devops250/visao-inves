import type { DashboardStats } from '@/lib/types';
import { formatDate, formatDateRange } from '@/lib/format';

interface Props {
  stats: DashboardStats;
  fetchedAt: string | null;
}

export function CampaignProgress({ stats, fetchedAt }: Props) {
  const reached = stats.completed + stats.voicemail;
  const pct = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const periodLabel = formatDateRange(stats.periodStart, stats.periodEnd);

  return (
    <div className="bg-white rounded-xl border border-navy-100 p-5 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-medium text-navy-900">Progresso da campanha</h2>
          <p className="text-xs text-navy-500 mt-1">
            Período {periodLabel} · {stats.total} ligações totais
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold text-navy-500">{pct.toFixed(1)}%</div>
          <div className="text-[10px] uppercase tracking-wider text-navy-400">conectadas</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-3 w-full bg-navy-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-navy-700 to-navy-400 transition-all duration-500"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <div className="text-navy-500 font-semibold text-base">{stats.total}</div>
          <div className="text-navy-400">ligações realizadas</div>
        </div>
        <div>
          <div className="text-amber-600 font-semibold text-base">{stats.voicemail}</div>
          <div className="text-navy-400">caixa postal</div>
        </div>
        <div>
          <div className="text-emerald-600 font-semibold text-base">{stats.completed}</div>
          <div className="text-navy-400">falaram com Sofia</div>
        </div>
        <div>
          <div className="text-red-600 font-semibold text-base">{stats.noAnswer}</div>
          <div className="text-navy-400">sem resposta</div>
        </div>
      </div>

      {fetchedAt && (
        <div className="mt-4 text-right text-[10px] text-navy-400">
          Atualizado: {formatDate(fetchedAt)} · {new Date(fetchedAt).toLocaleTimeString('pt-BR')}
        </div>
      )}
    </div>
  );
}
