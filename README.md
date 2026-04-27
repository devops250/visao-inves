# Sofia SDR · Painel de Ligações

Dashboard web para monitorar ligações da assistente de voz Sofia (VAPI) — Visão Investimentos.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Deploy: Vercel

## Setup

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Copiar `.env.local.example` para `.env.local` e preencher:
   ```
   VAPI_API_TOKEN=ea0c3cba-...
   VAPI_ASSISTANT_ID=0cceba6b-...
   VAPI_PHONE_NUMBER_ID=a5eac87d-...
   ```

3. Editar `data/historical-calls.json` com os links do Google Drive das ligações antigas (ou usar o script abaixo).

4. Rodar em dev:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm start` — servidor de produção
- `npm run generate-historical` — gera `data/historical-calls.json` a partir de filenames

Exemplo:
```bash
echo "2026-03-17_5511947272131.mp3" | npx tsx scripts/generate-historical.ts
```

## Estrutura

```
src/
  app/
    api/calls/             # /api/calls (lista) e /api/calls/[id]/recording (proxy áudio)
    page.tsx               # dashboard principal
  components/              # Header, StatsCards, CallCard, AudioPlayer, etc.
  lib/                     # types, vapi client, formatters, constants
data/historical-calls.json # ligações antigas (Google Drive)
scripts/generate-historical.ts
```

## Deploy (Vercel)

1. Conectar o repo ao Vercel
2. Configurar as env vars no painel da Vercel
3. Domínio customizado via Cloudflare DNS (CNAME → cname.vercel-dns.com)
