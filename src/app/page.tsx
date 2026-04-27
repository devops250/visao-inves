'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { StatsCards } from '@/components/StatsCards';
import { CampaignProgress } from '@/components/CampaignProgress';
import { FilterTabs } from '@/components/FilterTabs';
import { SearchBar } from '@/components/SearchBar';
import { CallList } from '@/components/CallList';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import type { Call, CallFilter, DashboardStats } from '@/lib/types';
import { POLLING_INTERVAL_MS } from '@/lib/constants';

interface ApiResponse {
  calls: Call[];
  vapiError: string | null;
  fetchedAt: string;
}

function computeStats(calls: Call[]): DashboardStats {
  const total = calls.length;
  const completed = calls.filter((c) => c.status === 'completed').length;
  const voicemail = calls.filter((c) => c.status === 'voicemail').length;
  const noAnswer = calls.filter((c) => c.status === 'no-answer').length;
  const failed = calls.filter((c) => c.status === 'failed').length;
  const withAnalysis = calls.filter((c) => c.analysis !== null).length;

  const dates = calls.map((c) => c.startedAt).filter(Boolean).sort();
  const periodStart = dates[0] || '';
  const periodEnd = dates[dates.length - 1] || '';

  return {
    total,
    completed,
    withAnalysis,
    voicemail,
    noAnswer,
    failed,
    periodStart,
    periodEnd,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
  };
}

export default function DashboardPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [filter, setFilter] = useState<CallFilter>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [periodTouched, setPeriodTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const failuresRef = useRef(0);

  async function load() {
    try {
      const res = await fetch('/api/calls', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      setCalls(data.calls);
      setFetchedAt(data.fetchedAt);
      setError(data.vapiError);
      failuresRef.current = 0;
    } catch (err) {
      failuresRef.current += 1;
      setError(err instanceof Error ? err.message : 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    function schedule() {
      const backoff = Math.min(POLLING_INTERVAL_MS * Math.pow(2, failuresRef.current), 120_000);
      const delay = failuresRef.current === 0 ? POLLING_INTERVAL_MS : backoff;
      timer = setTimeout(async () => {
        if (cancelled) return;
        await load();
        schedule();
      }, delay);
    }
    schedule();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const { minDate, maxDate } = useMemo(() => {
    const dates = calls.map((c) => c.startedAt.slice(0, 10)).filter(Boolean).sort();
    return { minDate: dates[0] || '', maxDate: dates[dates.length - 1] || '' };
  }, [calls]);

  // When data first loads, default the period filter to the full range.
  // Don't override if the user has already changed it.
  useEffect(() => {
    if (!periodTouched && minDate && maxDate) {
      setDateFrom(minDate);
      setDateTo(maxDate);
    }
  }, [minDate, maxDate, periodTouched]);

  const periodFilteredCalls = useMemo(() => {
    if (!dateFrom && !dateTo) return calls;
    return calls.filter((c) => {
      const day = c.startedAt.slice(0, 10);
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
      return true;
    });
  }, [calls, dateFrom, dateTo]);

  const stats = useMemo(() => computeStats(periodFilteredCalls), [periodFilteredCalls]);

  const counts: Record<CallFilter, number> = useMemo(
    () => ({
      all: periodFilteredCalls.length,
      completed: periodFilteredCalls.filter((c) => c.status === 'completed').length,
      'with-analysis': periodFilteredCalls.filter((c) => c.analysis !== null).length,
      voicemail: periodFilteredCalls.filter((c) => c.status === 'voicemail').length,
      'no-answer': periodFilteredCalls.filter((c) => c.status === 'no-answer').length,
    }),
    [periodFilteredCalls]
  );

  const visibleCalls = useMemo(() => {
    let list = periodFilteredCalls;
    switch (filter) {
      case 'completed':
        list = list.filter((c) => c.status === 'completed');
        break;
      case 'with-analysis':
        list = list.filter((c) => c.analysis !== null);
        break;
      case 'voicemail':
        list = list.filter((c) => c.status === 'voicemail');
        break;
      case 'no-answer':
        list = list.filter((c) => c.status === 'no-answer');
        break;
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const qDigits = q.replace(/\D/g, '');
      list = list.filter((c) => {
        const name = (c.customerName || '').toLowerCase();
        const phoneDigits = c.customerPhone.replace(/\D/g, '');
        return name.includes(q) || (qDigits.length > 0 && phoneDigits.includes(qDigits));
      });
    }
    return list;
  }, [periodFilteredCalls, filter, search]);

  function handlePeriodChange(from: string, to: string) {
    setDateFrom(from);
    setDateTo(to);
    setPeriodTouched(true);
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {error && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                Aviso: {error} — exibindo dados em cache/históricos.
              </div>
            )}

            <StatsCards
              stats={stats}
              dateFrom={dateFrom}
              dateTo={dateTo}
              minDate={minDate}
              maxDate={maxDate}
              onPeriodChange={handlePeriodChange}
            />
            <CampaignProgress stats={stats} fetchedAt={fetchedAt} />

            <div className="space-y-3">
              <FilterTabs active={filter} counts={counts} onChange={setFilter} />
              <SearchBar value={search} onChange={setSearch} />
            </div>

            <CallList calls={visibleCalls} />
          </>
        )}
      </main>
    </div>
  );
}
