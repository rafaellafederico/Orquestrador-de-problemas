const axios = require('axios');
const { retry } = require('../utils/retry');

const SYSTEM_PROMPT = `Você é um classificador de incidentes operacionais de e-commerce. Analise a mensagem e retorne APENAS JSON puro, sem markdown, sem backticks.

Campos obrigatórios:
- incident: boolean (true se for problema operacional)
- priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
- sector: string (ex: checkout, pagamento, pix, frete, site, cupom, carrinho)
- confidence: number de 0 a 100
- summary: string (resumo em 1 linha)
- incident_type: string (slug do tipo: checkout_bug, payment_failure, pix_error, site_down, shipping_error, coupon_error, cart_bug, system_lag)
- severity_score: number de 0 a 100

DETECTAR como incident=true:
- site fora do ar, site caiu, página não abre, site travando, lentidão
- checkout bugado, checkout infinito, não finaliza compra
- erro no pagamento, pagamento não processa, cartão recusado
- pix não aprova, pix não funciona, pix pendente
- erro no frete, frete não calcula
- cupom não funciona, cupom quebrado, código não aplica
- carrinho bugado, perdeu carrinho, produto sumiu do carrinho
- "não consigo comprar", "não consegui finalizar", "deu erro"

IGNORAR como incident=false (retornar incident: false):
- elogios, agradecimentos, "amei", "lindo", "chegou perfeito"
- dúvidas sobre produto ("tem em prata?", "qual o tamanho?")
- pedidos de desconto, promoções, cupons de desconto
- perguntas sobre prazo de entrega normal
- mensagens sem contexto de problema

Exemplos de prioridade:
- CRITICAL: site completamente fora do ar, todos os pagamentos falhando
- HIGH: checkout não finaliza, pix não aprova, erro de pagamento
- MEDIUM: frete não calcula, cupom inválido, lentidão parcial
- LOW: bug visual menor, reclamação isolada sem impacto claro`;

async function classifyIncident({ message, user, channel }) {
  const timeout = Number(process.env.REQUEST_TIMEOUT_MS || 15000);

  const payload = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `canal: ${channel}\nusuario: ${user}\nmensagem: ${message}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 300,
  };

  const response = await retry(
    () =>
      axios.post('https://api.openai.com/v1/chat/completions', payload, {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout,
      }),
    { tries: 3, delayMs: 500 },
  );

  const raw = response.data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(raw);
}

module.exports = { classifyIncident };
