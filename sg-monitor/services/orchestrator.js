const { classifyIncident } = require('../openai/classifier');
const { insertIncident } = require('../database/incidentsRepository');
const { enrichWithDedup, shouldSendAlert } = require('./deduplication');
const { sendAlert } = require('../whatsapp/whatsappService');
const { logger } = require('../utils/logger');

async function processIncomingMessage(input) {
  logger.info('message_received', { user: input.user, channel: input.channel });

  const ai = await classifyIncident(input);

  if (!ai.incident) {
    logger.info('message_ignored', { reason: 'non_incident', user: input.user });
    return { ignored: true };
  }

  logger.info('incident_detected', {
    incident_type: ai.incident_type,
    priority: ai.priority,
    confidence: ai.confidence,
    user: input.user,
  });

  const enriched = await enrichWithDedup({
    user: input.user,
    message: input.message,
    incident: true,
    incident_type: ai.incident_type || 'operational_issue',
    priority: ai.priority || 'HIGH',
    sector: ai.sector || 'ecommerce',
    confidence: ai.confidence ?? 75,
    summary: ai.summary || 'Incidente operacional detectado.',
    severity_score: ai.severity_score ?? 70,
    grouped_count: 1,
    channel: input.channel,
    created_at: input.timestamp || new Date().toISOString(),
  });

  const { groupKey } = enriched;
  const saved = await insertIncident(enriched);

  logger.info('incident_saved', { id: saved.id, priority: saved.priority, grouped_count: saved.grouped_count });

  if (shouldSendAlert(groupKey)) {
    await sendAlert({ ...saved, grouped_count: enriched.grouped_count });
    logger.warn('alert_sent', { id: saved.id, priority: saved.priority, groupKey });
  } else {
    logger.info('alert_suppressed_by_cooldown', { groupKey });
  }

  return saved;
}

module.exports = { processIncomingMessage };
