import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fetchVapiCalls } from '@/lib/vapi';
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

export async function GET() {
  const historical = await loadHistorical();
  const historicalCalls = historical.map(mapHistorical);

  let vapiCalls: Call[] = [];
  let vapiError: string | null = null;
  try {
    const raw = await fetchVapiCalls();
    vapiCalls = Array.isArray(raw) ? raw.map(mapVapiCall) : [];
  } catch (err) {
    vapiError = err instanceof Error ? err.message : 'unknown VAPI error';
  }

  const vapiKeys = new Set<string>();
  const merged: Call[] = [];

  for (const call of vapiCalls) {
    const key = dedupeKey(call);
    if (vapiKeys.has(key)) continue;
    vapiKeys.add(key);
    merged.push(call);
  }
  // Historical entries: skip only if a VAPI call already exists for that phone+day,
  // but allow multiple historical recordings for the same phone+day to coexist.
  for (const call of historicalCalls) {
    const key = dedupeKey(call);
    if (vapiKeys.has(key)) continue;
    merged.push(call);
  }

  merged.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return NextResponse.json(
    {
      calls: merged,
      vapiError,
      fetchedAt: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
