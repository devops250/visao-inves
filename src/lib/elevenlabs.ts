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

export async function listElevenLabsConversations(maxTotal = 500): Promise<ElevenLabsConversationSummary[]> {
  const { apiKey, agentId } = getConfig();
  const out: ElevenLabsConversationSummary[] = [];
  let cursor: string | null = null;

  do {
    const url = new URL(`${ELEVENLABS_BASE_URL}/v1/convai/conversations`);
    url.searchParams.set('agent_id', agentId);
    url.searchParams.set('page_size', '100');
    if (cursor) url.searchParams.set('cursor', cursor);

    const res = await fetch(url.toString(), {
      headers: { 'xi-api-key': apiKey },
      next: { revalidate: 0 },
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
  const { apiKey } = getConfig();
  const res = await fetch(
    `${ELEVENLABS_BASE_URL}/v1/convai/conversations/${conversationId}`,
    {
      headers: { 'xi-api-key': apiKey },
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs detail error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getElevenLabsAudio(conversationId: string): Promise<Response> {
  const { apiKey } = getConfig();
  return fetch(
    `${ELEVENLABS_BASE_URL}/v1/convai/conversations/${conversationId}/audio`,
    {
      headers: { 'xi-api-key': apiKey },
      next: { revalidate: 0 },
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

export async function fetchElevenLabsCallsWithDetails(maxTotal = 500, concurrency = 10) {
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
