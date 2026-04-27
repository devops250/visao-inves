import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fetchVapiCall } from '@/lib/vapi';
import type { HistoricalCall } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function loadHistorical(): Promise<HistoricalCall[]> {
  try {
    const file = path.join(process.cwd(), 'data', 'historical-calls.json');
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    if (id.startsWith('hist_')) {
      const historical = await loadHistorical();
      const item = historical.find((h) => h.id === id);
      if (!item || !item.driveUrl) {
        return NextResponse.json({ error: 'recording not found' }, { status: 404 });
      }
      return NextResponse.redirect(item.driveUrl, 302);
    }

    const call = await fetchVapiCall(id);
    const url = call?.recordingUrl || call?.stereoRecordingUrl;
    if (!url) {
      return NextResponse.json({ error: 'recording not available' }, { status: 404 });
    }
    return NextResponse.redirect(url, 302);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
