const twilio = require('twilio');
const { TWILIO_SID, TWILIO_TOKEN, WHATSAPP_FROM, WHATSAPP_TO } = require('../config/env');

async function sendAlert(msg) {
  const client = twilio(TWILIO_SID, TWILIO_TOKEN);

  await client.messages.create({
    from: WHATSAPP_FROM,
    to: WHATSAPP_TO,
    body: `🚨 SG MONITOR\n\n${msg}\n\n🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
  });
}

module.exports = sendAlert;
