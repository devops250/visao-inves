export function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (local.length < 10) return phone;
  const ddd = local.slice(0, 2);
  const number = local.slice(2);
  if (number.length === 9) {
    return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
  }
  return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month} · ${hours}:${minutes}`;
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateRange(start: string, end: string): string {
  if (!start || !end) return '—';
  const s = new Date(start);
  const e = new Date(end);
  const sd = s.getDate().toString().padStart(2, '0');
  const sm = (s.getMonth() + 1).toString().padStart(2, '0');
  const ed = e.getDate().toString().padStart(2, '0');
  const em = (e.getMonth() + 1).toString().padStart(2, '0');
  if (sd === ed && sm === em) return `${sd}/${sm}`;
  return `${sd}/${sm} – ${ed}/${em}`;
}
