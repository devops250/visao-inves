import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fetchVapiCall } from '@/lib/vapi';
import { getElevenLabsAudio } from '@/lib/elevenlabs';
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

function isElevenLabsId(id: string): boolean {
  return id.startsWith('conv_') || id.startsWith('convai_');
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
      const target = item?.audioUrl || item?.driveUrl;
      if (!target) {
        return NextResponse.json({ error: 'recording not found' }, { status: 404 });
      }
      if (target.startsWith('/')) {
        const host = _req.headers.get('host') || 'localhost';
        const proto = _req.headers.get('x-forwarded-proto') || 'https';
        return NextResponse.redirect(`${proto}://${host}${target}`, 302);
      }
      return NextResponse.redirect(target, 302);
    }

    if (isElevenLabsId(id)) {
      const upstream = await getElevenLabsAudio(id);
      if (!upstream.ok || !upstream.body) {
        return NextResponse.json(
          { error: `recording not available (ElevenLabs ${upstream.status})` },
          { status: upstream.status === 404 ? 404 : 502 }
        );
      }
      const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
      return new NextResponse(upstream.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=3600',
        },
      });
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
