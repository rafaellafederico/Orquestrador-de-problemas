const express = require('express');
const { validateWebhookChallenge, extractMessages } = require('../meta/webhookParser');
const { processIncomingMessage } = require('../services/orchestrator');
const { logger } = require('../utils/logger');

const router = express.Router();

router.get('/', (req, res) => {
  const result = validateWebhookChallenge(req.query);
  if (!result.ok) return res.sendStatus(403);
  return res.status(200).send(result.challenge);
});

router.post('/', async (req, res, next) => {
  try {
    const messages = extractMessages(req.body);
    await Promise.all(messages.map((msg) => processIncomingMessage(msg)));
    return res.status(200).json({ received: true, processed: messages.length });
  } catch (error) {
    logger.error('webhook_processing_error', { error: error.message });
    return next(error);
  }
});

module.exports = router;
