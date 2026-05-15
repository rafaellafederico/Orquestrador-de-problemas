require('dotenv').config();

// Validate required variables at startup
const REQUIRED = [
  'GEMINI_API_KEY',
  'META_VERIFY_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_KEY',
];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`[config] Missing env vars: ${missing.join(', ')}. Some features may not work.`);
  }
}

module.exports = {
  validateEnv,
  PORT: Number(process.env.PORT || 3000),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  META_VERIFY_TOKEN: process.env.META_VERIFY_TOKEN,
  META_PAGE_ACCESS_TOKEN: process.env.META_PAGE_ACCESS_TOKEN,
  WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID,
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  ALERT_PHONE: process.env.ALERT_PHONE || '5547992798329',
  ALERT_COOLDOWN_MINUTES: Number(process.env.ALERT_COOLDOWN_MINUTES || 15),
  DUPLICATE_WINDOW_MINUTES: Number(process.env.DUPLICATE_WINDOW_MINUTES || 10),
  DUPLICATE_THRESHOLD: Number(process.env.DUPLICATE_THRESHOLD || 5),
  REQUEST_TIMEOUT_MS: Number(process.env.REQUEST_TIMEOUT_MS || 15000),
};
