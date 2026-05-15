const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getClient() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY must be set in environment variables.');
  }

  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

// Proxy: supabase.from(...) delegates to the lazy client
const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      return (...args) => getClient()[prop](...args);
    },
  },
);

module.exports = { supabase };
