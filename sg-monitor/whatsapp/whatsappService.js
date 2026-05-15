const axios = require('axios');
const { retry } = require('../utils/retry');

function buildAlertMessage(data) {
  return `🚨 ALERTA SG\n\nTipo: ${data.incident_type}\nPrioridade: ${data.priority}\nConfiança: ${Math.round(data.confidence)}%\nSeveridade: ${Math.round(data.severity_score)}\nOcorrências(10min): ${data.groupedCount}\n\nMensagem:\n"${data.message}"\n\nUsuário:\n@${data.user}\n\nHorário:\n${data.created_at}`;
}

async function sendWhatsAppAlert(incident) {
  const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: process.env.ALERT_PHONE || '5547992798329',
    type: 'text',
    text: { body: buildAlertMessage(incident) },
  };

  await retry(() => axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: Number(process.env.REQUEST_TIMEOUT_MS || 15000),
  }), { tries: 4, delayMs: 500 });
}

module.exports = { sendWhatsAppAlert };
