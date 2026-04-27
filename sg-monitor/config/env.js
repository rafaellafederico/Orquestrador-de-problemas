require('dotenv').config();

module.exports = {
  CLAUDE_KEY: process.env.CLAUDE_KEY,
  NUVEMSHOP_TOKEN: process.env.NUVEMSHOP_TOKEN,
  NUVEMSHOP_STORE_ID: process.env.NUVEMSHOP_STORE_ID,
  TWILIO_SID: process.env.TWILIO_SID,
  TWILIO_TOKEN: process.env.TWILIO_TOKEN,
  WHATSAPP_FROM: process.env.WHATSAPP_FROM || 'whatsapp:+14155238886',
  WHATSAPP_TO: process.env.WHATSAPP_TO,
  SITE_URL: process.env.SITE_URL || 'https://www.saintgermainbrand.com.br',
  CEP_BASE: process.env.CEP_BASE || '88215000',
  MEDIA_HISTORICA_PEDIDOS: parseInt(process.env.MEDIA_HISTORICA_PEDIDOS || '5', 10),
};
