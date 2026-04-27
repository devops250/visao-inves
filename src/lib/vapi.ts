const VAPI_BASE_URL = 'https://api.vapi.ai';

export async function fetchVapiCalls(): Promise<any[]> {
  const token = process.env.VAPI_API_TOKEN;
  const assistantId = process.env.VAPI_ASSISTANT_ID;

  if (!token || !assistantId) {
    throw new Error('VAPI credentials not configured');
  }

  const res = await fetch(
    `${VAPI_BASE_URL}/call?assistantId=${assistantId}&limit=1000`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    throw new Error(`VAPI error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchVapiCall(callId: string): Promise<any> {
  const token = process.env.VAPI_API_TOKEN;
  if (!token) throw new Error('VAPI token not configured');

  const res = await fetch(`${VAPI_BASE_URL}/call/${callId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`VAPI error: ${res.status}`);
  }

  return res.json();
}
