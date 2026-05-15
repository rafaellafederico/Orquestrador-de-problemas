const axios = require('axios');
const { retry } = require('../utils/retry');

const timeout = Number(process.env.REQUEST_TIMEOUT_MS || 15000);

async function classifyIncident({ message, user, channel }) {
  const system = `Você classifica mensagens para incidentes operacionais do e-commerce. Retorne JSON puro com campos: incident(boolean), priority(LOW|MEDIUM|HIGH|CRITICAL), sector(string), confidence(number 0-100), summary(string), incident_type(string), severity_score(number 0-100). Incidentes válidos: queda site, checkout, pagamento, pix, frete, cupom quebrado, carrinho bugado, lentidão sistêmica. Ignorar elogios, dúvidas comerciais e desconto.`; 

  const payload = {
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    input: [
      { role: 'system', content: system },
      { role: 'user', content: `canal:${channel}\nusuario:${user}\nmensagem:${message}` },
    ],
    text: { format: { type: 'json_object' } },
  };

  const response = await retry(() => axios.post('https://api.openai.com/v1/responses', payload, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout,
  }));

  const raw = response.data.output?.[0]?.content?.[0]?.text || '{}';
  return JSON.parse(raw);
}

module.exports = { classifyIncident };
