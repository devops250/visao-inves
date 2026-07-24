const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io';

function getConfig() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    throw new Error('ElevenLabs credentials not configured');
  }
  return { apiKey, agentId };
}

export interface ElevenLabsConversationSummary {
  agent_id: string;
  agent_name?: string;
  conversation_id: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  message_count?: number;
  status?: string;
  call_successful?: 'success' | 'failure' | 'unknown';
}

interface ListResponse {
  conversations: ElevenLabsConversationSummary[];
  next_cursor?: string | null;
  has_more?: boolean;
}

// Terminal-status detail cache: once a conversation is done it never changes,
// so we never need to hit the API for it again after the first fetch.
const detailCache = new Map<string, any>();
const inFlightDetails = new Map<string, Promise<any>>();

const TERMINAL_STATUSES = new Set([
  'done',
  'completed',
  'ended',
  'finished',
  'failed',
  'error',
  'terminated',
]);

function isTerminalDetail(detail: any): boolean {
  const s = (detail?.status || '').toString().toLowerCase();
  if (TERMINAL_STATUSES.has(s)) return true;
  // If status is missing but analysis/transcript are present, treat as terminal.
  if (!s && (detail?.analysis || Array.isArray(detail?.transcript))) return true;
  return false;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxAttempts = 3
): Promise<Response> {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, init);
    if (res.status !== 429 || attempt >= maxAttempts - 1) return res;

    const retryAfter = Number(res.headers.get('retry-after'));
    const backoff = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : 400 * Math.pow(2, attempt);
    await sleep(backoff);
    attempt++;
  }
}

export async function listElevenLabsConversations(maxTotal = 300): Promise<ElevenLabsConversationSummary[]> {
  const { apiKey, agentId } = getConfig();
  const out: ElevenLabsConversationSummary[] = [];
  let cursor: string | null = null;

  do {
    const url = new URL(`${ELEVENLABS_BASE_URL}/v1/convai/conversations`);
    url.searchParams.set('agent_id', agentId);
    url.searchParams.set('page_size', '100');
    if (cursor) url.searchParams.set('cursor', cursor);

    const res = await fetchWithRetry(url.toString(), {
      headers: { 'xi-api-key': apiKey },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`ElevenLabs list error: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as ListResponse;
    out.push(...(data.conversations || []));
    cursor = data.has_more && data.next_cursor ? data.next_cursor : null;
  } while (cursor && out.length < maxTotal);

  return out.slice(0, maxTotal);
}

export async function getElevenLabsConversation(conversationId: string): Promise<any> {
  const cached = detailCache.get(conversationId);
  if (cached) return cached;

  const inFlight = inFlightDetails.get(conversationId);
  if (inFlight) return inFlight;

  const { apiKey } = getConfig();
  const promise = (async () => {
    const res = await fetchWithRetry(
      `${ELEVENLABS_BASE_URL}/v1/convai/conversations/${conversationId}`,
      {
        headers: { 'xi-api-key': apiKey },
        cache: 'no-store',
      }
    );
    if (!res.ok) {
      throw new Error(`ElevenLabs detail error: ${res.status} ${res.statusText}`);
    }
    const detail = await res.json();
    if (isTerminalDetail(detail)) {
      detailCache.set(conversationId, detail);
    }
    return detail;
  })();

  inFlightDetails.set(conversationId, promise);
  try {
    return await promise;
  } finally {
    inFlightDetails.delete(conversationId);
  }
}

export async function getElevenLabsAudio(conversationId: string): Promise<Response> {
  const { apiKey } = getConfig();
  return fetchWithRetry(
    `${ELEVENLABS_BASE_URL}/v1/convai/conversations/${conversationId}/audio`,
    {
      headers: { 'xi-api-key': apiKey },
      cache: 'no-store',
    }
  );
}

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = index++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function fetchElevenLabsCallsWithDetails(maxTotal = 300, concurrency = 3) {
  const summaries = await listElevenLabsConversations(maxTotal);
  return mapConcurrent(summaries, concurrency, async (s) => {
    try {
      const detail = await getElevenLabsConversation(s.conversation_id);
      return { summary: s, detail };
    } catch {
      return { summary: s, detail: null };
    }
  });
}
