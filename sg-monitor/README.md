# SG Incident Orchestrator

Sistema de monitoramento em tempo real de comentários e directs Instagram/Facebook com classificação por IA, persistência no Supabase, deduplicação e alerta imediato via WhatsApp Cloud API.

## Estrutura

- `server/` bootstrap do Express
- `routes/` endpoints `/webhook`, `/health`, `/incidents`, `/simulate`
- `openai/` classificador de incidentes
- `meta/` validação e parsing do webhook
- `whatsapp/` envio de alertas
- `database/` cliente e repositório Supabase
- `services/` orquestração e deduplicação
- `utils/` logger estruturado + retry

## Instalação

```bash
npm install
cp .env.example .env
npm start
```

## Variáveis de ambiente

Preencha `.env` com:

- OPENAI_API_KEY
- META_VERIFY_TOKEN
- META_PAGE_ACCESS_TOKEN
- WHATSAPP_PHONE_ID
- WHATSAPP_TOKEN
- SUPABASE_URL
- SUPABASE_KEY

## SQL Supabase

```sql
create table if not exists public.incidents (
  id bigint generated always as identity primary key,
  "user" text not null,
  message text not null,
  incident boolean not null default true,
  incident_type text not null,
  priority text not null,
  sector text not null,
  confidence numeric not null,
  severity_score numeric not null,
  summary text,
  channel text,
  created_at timestamptz not null default now()
);

create index if not exists incidents_created_at_idx on public.incidents (created_at desc);
create index if not exists incidents_group_idx on public.incidents (sector, incident_type, created_at desc);
```

## Endpoints

- `GET /health` → `{ "status":"ok" }`
- `GET /incidents?limit=30`
- `POST /simulate`
- `GET /webhook` (validação Meta)
- `POST /webhook` (recebimento de comentários/DM)

### Exemplo `/simulate`

```bash
curl -X POST http://localhost:3000/simulate \
  -H 'Content-Type: application/json' \
  -d '{"user":"cliente123","message":"checkout infinito, nao consigo comprar"}'
```

## Configuração Meta Webhook

1. Em Meta Developers, adicione app Facebook/Instagram.
2. Configure URL callback: `https://SEU_DOMINIO/webhook`.
3. Verify token igual ao `META_VERIFY_TOKEN`.
4. Assine campos de comentários e mensagens.

## WhatsApp Cloud API

1. Obtenha `WHATSAPP_PHONE_ID` e token permanente.
2. Garanta que número `5547992798329` esteja permitido no ambiente de teste (ou produção verificada).

## Deploy Railway

1. Crie projeto no Railway e conecte ao repositório.
2. Defina todas variáveis de ambiente.
3. Start command: `npm start`.
4. Habilite domínio público HTTPS e use na configuração do webhook Meta.

## Regras de detecção

O classificador IA detecta incidentes operacionais: queda de site, checkout, pagamento, pix, cupom, frete, carrinho e instabilidade. Ignora elogios, dúvidas comerciais e pedidos de desconto.

## Anti-spam, deduplicação e cooldown

- Janela de deduplicação: `DUPLICATE_WINDOW_MINUTES` (padrão 10)
- Limiar de agrupamento: `DUPLICATE_THRESHOLD` (padrão 5)
- Cooldown de alerta por grupo: `ALERT_COOLDOWN_MINUTES` (padrão 15)
- Retry automático para OpenAI/WhatsApp
- Rate limit no servidor para anti-flood
