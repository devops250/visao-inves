import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fetchVapiCalls } from '@/lib/vapi';
import { fetchElevenLabsCallsWithDetails } from '@/lib/elevenlabs';
import type { Call, HistoricalCall } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function mapVapiStatus(call: any): Call['status'] {
  const status = call.status;
  const reason = call.endedReason;
  if (status === 'in-progress' || status === 'queued' || status === 'ringing') {
    return 'in-progress';
  }
  if (status === 'ended') {
    if (reason === 'customer-ended-call' || reason === 'assistant-ended-call') {
      return 'completed';
    }
    if (reason === 'voicemail') return 'voicemail';
    if (reason === 'customer-did-not-answer' || reason === 'customer-busy') {
      return 'no-answer';
    }
    return 'failed';
  }
  return 'failed';
}

function mapVapiCall(call: any): Call {
  const startedAt = call.startedAt || call.createdAt || new Date().toISOString();
  const endedAt = call.endedAt || null;
  let duration = 0;
  if (endedAt && startedAt) {
    duration = Math.max(0, (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  }

  const customerName =
    call?.customer?.name ||
    call?.assistantOverrides?.variableValues?.leadName ||
    call?.assistantOverrides?.variableValues?.name ||
    null;

  return {
    id: call.id,
    customerPhone: call?.customer?.number || '',
    customerName,
    startedAt,
    endedAt,
    duration,
    status: mapVapiStatus(call),
    recordingUrl: call.recordingUrl || call.stereoRecordingUrl || null,
    transcript: call.transcript || null,
    summary: call?.analysis?.summary || null,
    analysis: call.analysis || null,
    source: 'vapi',
    cost: typeof call.cost === 'number' ? call.cost : null,
  };
}

function mapElevenLabsStatus(summary: any, detail: any): Call['status'] {
  const status = detail?.status ?? summary?.status;
  if (status === 'in-progress' || status === 'processing' || status === 'initiated') {
    return 'in-progress';
  }

  const termination: string = (detail?.metadata?.termination_reason || '').toLowerCase();
  const resultado =
    detail?.analysis?.data_collection_results?.resultado_ligacao?.value ||
    detail?.analysis?.data_collection_results?.resultado_ligacao?.result ||
    null;

  const toolsUsed: string[] = Array.isArray(detail?.transcript)
    ? detail.transcript
        .flatMap((t: any) => t?.tool_calls || [])
        .map((t: any) => (t?.tool_name || t?.name || '').toLowerCase())
    : [];
  const voicemailDetected =
    toolsUsed.some((t) => t.includes('voicemail')) ||
    resultado === 'sem_contato' ||
    termination.includes('voicemail');

  if (status === 'failed' || status === 'error') {
    if (termination.includes('no-answer') || termination.includes('no_answer')) return 'no-answer';
    if (termination.includes('busy')) return 'no-answer';
    return 'failed';
  }

  if (voicemailDetected) return 'voicemail';

  // Very short calls with no assistant/user exchange are typically not answered.
  const duration = detail?.metadata?.call_duration_secs ?? summary?.call_duration_secs ?? 0;
  const messageCount = detail?.transcript?.length ?? summary?.message_count ?? 0;
  if (duration < 3 && messageCount < 2) return 'no-answer';

  return 'completed';
}

function flattenTranscript(detail: any): string | null {
  const t = detail?.transcript;
  if (!Array.isArray(t) || t.length === 0) return null;
  return t
    .map((turn: any) => {
      const role = (turn?.role || turn?.speaker || 'unknown').toString();
      const speaker = role === 'agent' ? 'Sofia' : role === 'user' ? 'Lead' : role;
      const msg = turn?.message || turn?.text || '';
      return msg ? `[${speaker}] ${msg}` : '';
    })
    .filter(Boolean)
    .join('\n');
}

function mapElevenLabsCall(entry: { summary: any; detail: any }): Call {
  const { summary, detail } = entry;
  const conversationId = detail?.conversation_id || summary.conversation_id;
  const startUnix = detail?.metadata?.start_time_unix_secs ?? summary.start_time_unix_secs;
  const startedAt = startUnix ? new Date(startUnix * 1000).toISOString() : new Date().toISOString();
  const duration = detail?.metadata?.call_duration_secs ?? summary.call_duration_secs ?? 0;
  const endedAt = startUnix ? new Date((startUnix + duration) * 1000).toISOString() : null;

  const dyn = detail?.conversation_initiation_client_data?.dynamic_variables || {};
  const customerName = dyn.name || dyn.first_name || null;
  const customerPhone =
    detail?.metadata?.phone_call?.external_number ||
    detail?.metadata?.phone_call?.to ||
    dyn.phone ||
    dyn.telefone ||
    '';

  return {
    id: conversationId,
    customerPhone,
    customerName,
    startedAt,
    endedAt,
    duration,
    status: mapElevenLabsStatus(summary, detail),
    recordingUrl: detail ? `/api/calls/${conversationId}/recording` : null,
    transcript: flattenTranscript(detail),
    summary: detail?.analysis?.transcript_summary || null,
    analysis: detail?.analysis || null,
    source: 'elevenlabs',
    cost: null,
  };
}

function mapHistorical(h: HistoricalCall): Call {
  const startedAt = h.startedAt || `${h.date}T00:00:00.000Z`;
  return {
    id: h.id,
    customerPhone: h.customerPhone,
    customerName: h.customerName,
    startedAt,
    endedAt: null,
    duration: h.duration ?? 0,
    status: h.status,
    recordingUrl: h.audioUrl || h.driveUrl || null,
    transcript: null,
    summary: null,
    analysis: null,
    source: 'historical',
    cost: null,
  };
}

async function loadHistorical(): Promise<HistoricalCall[]> {
  try {
    const file = path.join(process.cwd(), 'data', 'historical-calls.json');
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function dedupeKey(c: Call): string {
  const phone = c.customerPhone.replace(/\D/g, '').slice(-11);
  const day = c.startedAt.slice(0, 10);
  return `${phone}_${day}`;
}

interface CallsPayload {
  calls: Call[];
  vapiError: string | null;
  elevenLabsError: string | null;
  fetchedAt: string;
  elevenLabsStale?: boolean;
}

// Server-side cache aligns with the 30s frontend polling to absorb parallel
// tabs and clients into a single upstream fetch cycle.
const RESPONSE_TTL_MS = 30_000;
let cachedPayload: { data: CallsPayload; ts: number } | null = null;
let inFlight: Promise<CallsPayload> | null = null;

// Snapshot of the last successful ElevenLabs response so that transient 429s
// don't collapse the dashboard back to March-only historical data.
let lastGoodElevenCalls: Call[] | null = null;

async function buildPayload(): Promise<CallsPayload> {
  const historical = await loadHistorical();
  const historicalCalls = historical.map(mapHistorical);

  const [vapiResult, elevenResult] = await Promise.all([
    (async () => {
      try {
        const raw = await fetchVapiCalls();
        return {
          calls: Array.isArray(raw) ? raw.map(mapVapiCall) : [],
          error: null as string | null,
        };
      } catch (err) {
        return {
          calls: [] as Call[],
          error: err instanceof Error ? err.message : 'unknown VAPI error',
        };
      }
    })(),
    (async () => {
      try {
        const entries = await fetchElevenLabsCallsWithDetails();
        const calls = entries.map(mapElevenLabsCall);
        lastGoodElevenCalls = calls;
        return { calls, error: null as string | null, stale: false };
      } catch (err) {
        const error = err instanceof Error ? err.message : 'unknown ElevenLabs error';
        if (lastGoodElevenCalls) {
          return { calls: lastGoodElevenCalls, error, stale: true };
        }
        return { calls: [] as Call[], error, stale: false };
      }
    })(),
  ]);

  const seenKeys = new Set<string>();
  const merged: Call[] = [];

  // ElevenLabs first — it's the current source of truth going forward.
  for (const call of elevenResult.calls) {
    const key = dedupeKey(call);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    merged.push(call);
  }
  for (const call of vapiResult.calls) {
    const key = dedupeKey(call);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    merged.push(call);
  }
  for (const call of historicalCalls) {
    const key = dedupeKey(call);
    if (seenKeys.has(key)) continue;
    merged.push(call);
  }

  merged.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return {
    calls: merged,
    vapiError: vapiResult.error,
    elevenLabsError: elevenResult.error,
    fetchedAt: new Date().toISOString(),
    elevenLabsStale: elevenResult.stale,
  };
}

async function getPayload(): Promise<CallsPayload> {
  const now = Date.now();
  if (cachedPayload && now - cachedPayload.ts < RESPONSE_TTL_MS) {
    return cachedPayload.data;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const data = await buildPayload();
      cachedPayload = { data, ts: Date.now() };
      return data;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export async function GET() {
  const data = await getPayload();
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
