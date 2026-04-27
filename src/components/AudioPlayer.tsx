'use client';

import { useState } from 'react';
import type { Call } from '@/lib/types';

interface Props {
  call: Call;
}

export function AudioPlayer({ call }: Props) {
  const [showTranscript, setShowTranscript] = useState(false);
  // Local static audio (historical) is served directly; VAPI audio goes through the proxy
  const audioSrc = call.recordingUrl && call.recordingUrl.startsWith('/')
    ? call.recordingUrl
    : `/api/calls/${call.id}/recording`;

  return (
    <div className="mt-4 pt-4 border-t border-navy-100 space-y-3 animate-fade-in">
      <audio controls preload="none" src={audioSrc} className="w-full">
        Seu navegador não suporta o player de áudio.
      </audio>

      {call.summary && (
        <div className="bg-navy-50 rounded-lg p-3 text-sm text-navy-800">
          <div className="text-[10px] uppercase tracking-wider text-navy-500 font-medium mb-1">
            Análise IA
          </div>
          {call.summary}
        </div>
      )}

      {call.transcript && (
        <div>
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className="text-xs text-navy-600 hover:text-navy-800 font-medium"
          >
            {showTranscript ? '▼ Ocultar transcrição' : '▶ Ver transcrição'}
          </button>
          {showTranscript && (
            <pre className="mt-2 bg-white border border-navy-100 rounded-lg p-3 text-xs text-navy-700 whitespace-pre-wrap max-h-72 overflow-y-auto font-sans">
              {call.transcript}
            </pre>
          )}
        </div>
      )}

      {call.cost !== null && call.cost > 0 && (
        <div className="text-[10px] text-navy-400">
          Custo: US$ {call.cost.toFixed(4)}
        </div>
      )}
    </div>
  );
}
