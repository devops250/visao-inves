import fs from 'node:fs';
import path from 'node:path';

const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'drive-list.json'), 'utf-8'));

const counters = new Map();
const out = [];

for (const [fileId, filename] of raw) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})_(\d+)\.mp3$/);
  if (!m) continue;
  const [, date, rawPhone] = m;
  const phone = rawPhone.startsWith('55') ? `+${rawPhone}` : `+55${rawPhone}`;
  const key = `${rawPhone}_${date}`;
  const n = counters.get(key) ?? 0;
  counters.set(key, n + 1);
  const minutes = 9 * 60 + n * 5;
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  out.push({
    id: `hist_${fileId}`,
    customerPhone: phone,
    customerName: null,
    date,
    startedAt: `${date}T${hh}:${mm}:00.000Z`,
    audioUrl: `/audio/${fileId}.mp3`,
    duration: null,
    status: 'completed',
  });
}

out.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

const outPath = path.join(process.cwd(), 'data', 'historical-calls.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${out.length} entries to ${outPath}`);
