# SG Incident Orchestrator

Sistema de monitoramento em tempo real de comentários e directs Instagram/Facebook da Saint Germain. Classifica mensagens com IA (OpenAI), salva no Supabase, deduplica incidentes e envia alertas imediatos via WhatsApp Cloud API.

## Fluxo

```
Instagram/Facebook
      ↓
 Meta Webhook
      ↓
 Node.js Server
      ↓
OpenAI Classifier
      ↓
 Deduplication
      ↓
 Supabase Logs
      ↓
WhatsApp Alert
```

## Estrutura de arquivos

```
sg-monitor/
├── index.js                    # Entry point
├── package.json
├── .env.example
├── config/
│   └── env.js                  # Configuração e validação de variáveis
├── server/
│   └── app.js                  # Express bootstrap (helmet, rate-limit, rotas)
├── routes/
│   ├── webhook.js              # GET/POST /webhook (Meta)
│   ├── incidents.js            # GET /incidents
│   └── simulate.js             # POST /simulate
├── meta/
│   └── webhookParser.js        # Validação challenge + extração de mensagens
├── openai/
│   └── classifier.js           # Classificador IA via chat/completions
├── whatsapp/
│   └── whatsappService.js      # Envio de alertas via Meta Graph API
├── database/
│   ├── supabaseClient.js       # Cliente Supabase
│   └── incidentsRepository.js  # insert, list, findDuplicates
├── services/
│   ├── orchestrator.js         # Orquestração do fluxo completo
│   └── deduplication.js        # Agrupamento, escalada de prioridade, cooldown
└── utils/
    ├── logger.js               # Logger JSON estruturado
    └── retry.js                # Retry com backoff exponencial
```

---

## Instalação

```bash
cd sg-monitor
npm install
cp .env.example .env
# Preencha o .env com as chaves reais
npm start
```

Para desenvolvimento com hot reload:

```bash
npm run dev
```

---

## Variáveis de ambiente

Crie `.env` copiando `.env.example`:

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (padrão: 3000) |
| `OPENAI_API_KEY` | Chave da API OpenAI |
| `OPENAI_MODEL` | Modelo (padrão: `gpt-4o-mini`) |
| `META_VERIFY_TOKEN` | Token de verificação do webhook Meta |
| `META_PAGE_ACCESS_TOKEN` | Token de acesso à página Facebook/Instagram |
| `WHATSAPP_PHONE_ID` | ID do número WhatsApp Business |
| `WHATSAPP_TOKEN` | Token permanente WhatsApp Cloud API |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_KEY` | Chave anon/service do Supabase |
| `ALERT_PHONE` | Número de destino dos alertas (padrão: `5547992798329`) |
| `ALERT_COOLDOWN_MINUTES` | Cooldown entre alertas do mesmo grupo (padrão: 15) |
| `DUPLICATE_WINDOW_MINUTES` | Janela de deduplicação em minutos (padrão: 10) |
| `DUPLICATE_THRESHOLD` | Mínimo de ocorrências para escalar prioridade (padrão: 5) |
| `REQUEST_TIMEOUT_MS` | Timeout para chamadas externas (padrão: 15000) |

---

## SQL — Supabase

Execute no SQL Editor do Supabase:

```sql
create table if not exists public.incidents (
  id            bigint generated always as identity primary key,
  "user"        text        not null,
  message       text        not null,
  incident      boolean     not null default true,
  incident_type text        not null,
  priority      text        not null,
  sector        text        not null,
  confidence    numeric     not null,
  severity_score numeric    not null,
  grouped_count integer     not null default 1,
  summary       text,
  channel       text,
  created_at    timestamptz not null default now()
);

-- Índices para deduplicação e listagem eficiente
create index if not exists incidents_created_at_idx
  on public.incidents (created_at desc);

create index if not exists incidents_group_idx
  on public.incidents (sector, incident_type, created_at desc);
```

> **Row Level Security:** Em produção, use a chave `service_role` no `SUPABASE_KEY` para ter acesso total, ou configure as políticas RLS adequadas.

---

## Endpoints

### `GET /health`

```json
{ "status": "ok" }
```

### `GET /incidents?limit=30`

Retorna os últimos incidentes detectados (máx. 100).

```json
{
  "incidents": [
    {
      "id": 1,
      "user": "cliente123",
      "message": "checkout infinito, não consigo comprar",
      "incident_type": "checkout_bug",
      "priority": "HIGH",
      "sector": "checkout",
      "confidence": 96,
      "severity_score": 82,
      "grouped_count": 1,
      "summary": "Cliente relata loop infinito no checkout",
      "channel": "instagram_comment",
      "created_at": "2024-01-15T14:30:00Z"
    }
  ]
}
```

### `POST /simulate`

Testa o pipeline completo sem precisar de webhook real.

**Body:**
```json
{
  "user": "cliente123",
  "message": "não consigo finalizar a compra, checkout tá bugado",
  "channel": "simulation"
}
```

**Response:**
```json
{
  "ok": true,
  "result": { ...incidenteSalvo }
}
```

### `GET /webhook` — Validação Meta

Usado pelo Meta para verificar o endpoint. Parâmetros automáticos:
- `hub.mode=subscribe`
- `hub.verify_token=SEU_TOKEN`
- `hub.challenge=VALOR_RETORNADO`

### `POST /webhook` — Recebimento de eventos

Recebe comentários e DMs do Instagram/Facebook.

---

## Exemplos curl

### Testar health

```bash
curl http://localhost:3000/health
```

### Simular incidente HIGH

```bash
curl -X POST http://localhost:3000/simulate \
  -H 'Content-Type: application/json' \
  -d '{"user":"cliente123","message":"checkout infinito, não consigo comprar"}'
```

### Simular queda de site

```bash
curl -X POST http://localhost:3000/simulate \
  -H 'Content-Type: application/json' \
  -d '{"user":"maria_silva","message":"o site de vocês caiu? não abre nada"}'
```

### Simular PIX sem aprovação

```bash
curl -X POST http://localhost:3000/simulate \
  -H 'Content-Type: application/json' \
  -d '{"user":"joao_souza","message":"fiz o pix mas não aprovou, já faz 1 hora"}'
```

### Simular mensagem ignorada

```bash
curl -X POST http://localhost:3000/simulate \
  -H 'Content-Type: application/json' \
  -d '{"user":"ana_lima","message":"amei o colar, chegou perfeito!"}'
```

### Listar incidentes

```bash
curl http://localhost:3000/incidents?limit=10
```

### Simular webhook Meta (comentário)

```bash
curl -X POST http://localhost:3000/webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "item": "comment",
          "text": "site fora do ar não consigo entrar",
          "from": { "username": "usuario_teste", "id": "123456" },
          "created_time": '$(date +%s)'
        }
      }]
    }]
  }'
```

---

## Detecção de incidentes

O classificador IA detecta automaticamente:

| Mensagem | Tipo | Prioridade |
|---|---|---|
| "site caiu?" | `site_down` | HIGH |
| "não consigo pagar" | `payment_failure` | HIGH |
| "checkout bugou" | `checkout_bug` | HIGH |
| "pix não aprova" | `pix_error` | HIGH |
| "cupom não vai" | `coupon_error` | MEDIUM |
| "frete não calcula" | `shipping_error` | MEDIUM |
| "tem prata?" | ignorado | — |
| "amei o produto" | ignorado | — |

---

## Anti-spam e deduplicação

- **Janela de deduplicação:** `DUPLICATE_WINDOW_MINUTES` (padrão 10 min) — agrupa por `sector:incident_type`
- **Escalonamento:** Se ≥ `DUPLICATE_THRESHOLD` ocorrências na janela, eleva prioridade (LOW→MEDIUM→HIGH→CRITICAL) e +15 na severidade
- **Cooldown de alerta:** `ALERT_COOLDOWN_MINUTES` (padrão 15 min) — evita spam de WhatsApp para o mesmo grupo
- **Rate limiting:** 120 req/min por IP no servidor
- **Retry automático:** OpenAI (3 tentativas) e WhatsApp (4 tentativas) com backoff exponencial

---

## Formato do alerta WhatsApp

```
🚨 ALERTA SG

Tipo: checkout_bug
Prioridade: HIGH
Confiança: 96%
Severidade: 82/100
Ocorrências(10min): 3

Mensagem:
"checkout infinito, não consigo comprar"

Usuário:
@cliente123

Resumo:
Cliente relata loop infinito no checkout sem conseguir finalizar

Horário:
15/01/2024 11:30:00
```

---

## Configuração Meta Webhook

1. Acesse [Meta for Developers](https://developers.facebook.com/) e crie um App
2. Adicione o produto **Webhooks** (para Facebook) ou **Instagram** (para Instagram)
3. Configure a URL do callback: `https://SEU_DOMINIO/webhook`
4. Defina o `META_VERIFY_TOKEN` igual ao valor no seu `.env`
5. Clique em **Verify and Save**
6. Assine os campos:
   - Facebook: `feed` (comentários) e `messages` (DMs)
   - Instagram: `comments` e `messages`
7. Obtenha um **Page Access Token** de longa duração e coloque em `META_PAGE_ACCESS_TOKEN`

---

## WhatsApp Cloud API

1. No [Meta for Developers](https://developers.facebook.com/), adicione o produto **WhatsApp**
2. Em **Getting Started**, copie o `Phone number ID` → `WHATSAPP_PHONE_ID`
3. Gere um token permanente (System User com permissão `whatsapp_business_messaging`) → `WHATSAPP_TOKEN`
4. Em ambiente de teste, adicione o número `+55 47 99279-8329` como destinatário permitido
5. Em produção, use número verificado — o destinatário pode ser qualquer número

---

## Deploy Railway

1. Crie uma conta em [railway.app](https://railway.app)
2. Clique em **New Project → Deploy from GitHub repo**
3. Selecione o repositório e a pasta `sg-monitor`
4. Em **Variables**, adicione todas as variáveis do `.env.example`
5. Em **Settings → Networking**, habilite **Public Domain** (HTTPS automático)
6. Use a URL gerada como callback do Meta Webhook
7. Start command: `npm start` (já configurado no `package.json`)

Railway detecta automaticamente Node.js e usa `npm start`.

---

## Segurança

- **Helmet** — headers de segurança HTTP
- **Rate limiting** — 120 req/min por IP
- **Verify token** — valida todos os challenges do Meta
- **Variáveis de ambiente** — nenhuma credencial no código
- **Timeout** — todas chamadas externas têm timeout configurável
- **Retry com backoff** — evita sobrecarga em falhas transitórias
