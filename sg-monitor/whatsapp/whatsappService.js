const axios = require('axios');
const { retry } = require('../utils/retry');

function formatTimestamp(isoString) {
  try {
    return new Date(isoString).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function buildAlertMessage(data) {
  const lines = [
    '🚨 ALERTA SG',
    '',
    `Tipo: ${data.incident_type}`,
    `Prioridade: ${data.priority}`,
    `Confiança: ${Math.round(data.confidence)}%`,
    `Severidade: ${Math.round(data.severity_score)}/100`,
    `Ocorrências(10min): ${data.grouped_count || 1}`,
    '',
    'Mensagem:',
    `"${data.message}"`,
    '',
    'Usuário:',
    `@${data.user}`,
    '',
    'Resumo:',
    data.summary || '-',
    '',
    'Horário:',
    formatTimestamp(data.created_at),
  ];

  return lines.join('\n');
}

async function sendWhatsAppAlert(incident) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;
  const alertPhone = process.env.ALERT_PHONE || '5547992798329';

  if (!phoneId || !token) {
    throw new Error('WHATSAPP_PHONE_ID and WHATSAPP_TOKEN must be set');
  }

  const url = `https://graph.facebook.com/v22.0/${phoneId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: alertPhone,
    type: 'text',
    text: { body: buildAlertMessage(incident) },
  };

  await retry(
    () =>
      axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: Number(process.env.REQUEST_TIMEOUT_MS || 15000),
      }),
    { tries: 4, delayMs: 500 },
  );
}

module.exports = { sendWhatsAppAlert };
