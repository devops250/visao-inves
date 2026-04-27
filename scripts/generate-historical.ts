#!/usr/bin/env tsx
/**
 * Lê filenames no formato YYYY-MM-DD_PHONE.mp3 (um por linha via stdin ou args)
 * e gera data/historical-calls.json com placeholders para driveUrl.
 *
 * Uso:
 *   echo "2026-03-17_5511947272131.mp3" | npx tsx scripts/generate-historical.ts
 *   npx tsx scripts/generate-historical.ts arquivo1.mp3 arquivo2.mp3
 */

import fs from 'node:fs';
import path from 'node:path';

interface HistoricalEntry {
  id: string;
  customerPhone: string;
  customerName: null;
  date: string;
  driveUrl: string;
  duration: null;
  status: 'completed';
}

function parseFilename(name: string): HistoricalEntry | null {
  const base = path.basename(name).replace(/\.(mp3|wav|m4a)$/i, '');
  const m = base.match(/^(\d{4}-\d{2}-\d{2})_(\d+)$/);
  if (!m) return null;
  const [, date, rawPhone] = m;
  const phone = rawPhone.startsWith('55') ? `+${rawPhone}` : `+55${rawPhone}`;
  return {
    id: `hist_${date.replace(/-/g, '')}_${rawPhone}`,
    customerPhone: phone,
    customerName: null,
    date,
    driveUrl: 'https://drive.google.com/uc?export=download&id=GOOGLE_FILE_ID_AQUI',
    duration: null,
    status: 'completed',
  };
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}

async function main() {
  const fromArgs = process.argv.slice(2);
  const fromStdin = (await readStdin())
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const inputs = [...fromArgs, ...fromStdin];
  if (inputs.length === 0) {
    console.error('Forneça filenames via stdin ou argumentos.');
    process.exit(1);
  }

  const entries: HistoricalEntry[] = [];
  for (const f of inputs) {
    const e = parseFilename(f);
    if (!e) {
      console.warn(`Ignorado (formato inválido): ${f}`);
      continue;
    }
    entries.push(e);
  }

  const outFile = path.join(process.cwd(), 'data', 'historical-calls.json');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
  console.log(`Gravado ${entries.length} registros em ${outFile}`);
  console.log('Edite os campos driveUrl com os links do Google Drive antes de fazer deploy.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
