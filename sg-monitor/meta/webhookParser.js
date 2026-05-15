function validateWebhookChallenge(query) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return { ok: true, challenge };
  }
  return { ok: false };
}

function extractMessages(body) {
  const out = [];
  const entries = body.entry || [];

  entries.forEach((entry) => {
    const changes = entry.changes || [];
    changes.forEach((change) => {
      const value = change.value || {};
      const item = value.item;

      if (item === 'comment' && value.text) {
        out.push({
          user: value.from?.username || value.from?.id || 'unknown',
          message: value.text,
          timestamp: value.created_time ? new Date(Number(value.created_time) * 1000).toISOString() : new Date().toISOString(),
          channel: 'instagram_comment',
        });
      }

      if (value.messages && Array.isArray(value.messages)) {
        value.messages.forEach((m) => {
          out.push({
            user: m.from || 'unknown',
            message: m.text?.body || '',
            timestamp: m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : new Date().toISOString(),
            channel: 'instagram_dm',
          });
        });
      }
    });
  });

  return out.filter((x) => x.message && x.message.trim().length > 0);
}

module.exports = { validateWebhookChallenge, extractMessages };
