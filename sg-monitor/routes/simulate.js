const express = require('express');
const { processIncomingMessage } = require('../services/orchestrator');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { user, message, channel = 'simulation' } = req.body || {};
    if (!user || !message) {
      return res.status(400).json({ error: 'user_and_message_required' });
    }
    const result = await processIncomingMessage({ user, message, channel, timestamp: new Date().toISOString() });
    return res.status(200).json({ ok: true, result });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
