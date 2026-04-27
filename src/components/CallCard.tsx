'use client';

import { useState } from 'react';
import type { Call } from '@/lib/types';
import { formatPhone, formatDateTime, formatDuration } from '@/lib/format';
import { STATUS_LABELS, STATUS_CLASSES } from '@/lib/constants';
import { AudioPlayer } from './AudioPlayer';

interface Props {
  call: Call;
}

export function CallCard({ call }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-navy-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold uppercase tracking-wide text-navy-900 truncate">
              {call.customerName || 'LEAD SEM NOME'}
            </span>
            <span
              className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${
                STATUS_CLASSES[call.status]
              }`}
            >
              {STATUS_LABELS[call.status]}
            </span>
            {call.source === 'historical' && (
              <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border bg-navy-50 text-navy-700 border-navy-200">
                HISTÓRICO
              </span>
            )}
          </div>
          <div className="text-sm text-navy-600 mt-0.5">{formatPhone(call.customerPhone)}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-navy-500">
            <div>{formatDateTime(call.startedAt)}</div>
            <div className="font-medium text-navy-700 mt-0.5">{formatDuration(call.duration)}</div>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            disabled={!call.recordingUrl && call.source === 'vapi'}
            className="w-10 h-10 rounded-full bg-navy-600 text-white flex items-center justify-center hover:bg-navy-700 disabled:bg-navy-200 disabled:cursor-not-allowed transition-colors"
            title={expanded ? 'Fechar player' : 'Ouvir gravação'}
          >
            {expanded ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="5" y="4" width="3" height="12" rx="1" />
                <rect x="12" y="4" width="3" height="12" rx="1" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 4l10 6-10 6V4z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {expanded && <AudioPlayer call={call} />}
    </div>
  );
}
