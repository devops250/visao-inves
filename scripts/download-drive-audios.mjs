import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const list = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'drive-list.json'), 'utf-8'));
const outDir = path.join(process.cwd(), 'public', 'audio');
fs.mkdirSync(outDir, { recursive: true });

async function downloadOne(fileId) {
  const out = path.join(outDir, `${fileId}.mp3`);
  if (fs.existsSync(out) && fs.statSync(out).size > 1000) return { fileId, status: 'skip', size: fs.statSync(out).size };
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) return { fileId, status: 'fail', err: `HTTP ${res.status}` };
  const buf = Buffer.from(await res.arrayBuffer());
  // Heuristic: if response starts with HTML it's the virus warning page
  if (buf.slice(0, 16).toString().match(/<!DOCTYPE|<html/i)) {
    return { fileId, status: 'fail', err: 'got HTML (virus warning)' };
  }
  fs.writeFileSync(out, buf);
  return { fileId, status: 'ok', size: buf.length };
}

async function runInBatches(items, fn, batchSize = 8) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const settled = await Promise.all(batch.map(fn));
    results.push(...settled);
    process.stdout.write(`  ${Math.min(i + batchSize, items.length)}/${items.length}\r`);
  }
  return results;
}

const fileIds = [...new Set(list.map(([id]) => id))];
console.log(`Downloading ${fileIds.length} unique files in batches of 8...`);
const results = await runInBatches(fileIds, downloadOne, 8);

const ok = results.filter(r => r.status === 'ok').length;
const skip = results.filter(r => r.status === 'skip').length;
const fail = results.filter(r => r.status === 'fail');
const totalBytes = results.reduce((sum, r) => sum + (r.size || 0), 0);

console.log(`\nDone. ok=${ok} skip=${skip} fail=${fail.length}  total=${(totalBytes / 1e6).toFixed(2)} MB`);
if (fail.length) {
  console.log('Failures:');
  fail.forEach(f => console.log(`  ${f.fileId}: ${f.err}`));
}
