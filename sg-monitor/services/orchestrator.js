const { classifyIncident } = require('../openai/classifier');
const { insertIncident } = require('../database/incidentsRepository');
const { enrichWithDedup, shouldSendAlert } = require('./deduplication');
const { sendWhatsAppAlert } = require('../whatsapp/whatsappService');
const { logger } = require('../utils/logger');

async function processIncomingMessage(input) {
  const ai = await classifyIncident(input);
  if (!ai.incident) {
    logger.info('message_ignored', { reason: 'non_incident', user: input.user });
    return { ignored: true };
  }

  const incident = await enrichWithDedup({
    user: input.user,
    message: input.message,
    incident: true,
    incident_type: ai.incident_type || 'operational_issue',
    priority: ai.priority || 'HIGH',
    sector: ai.sector || 'ecommerce',
    confidence: ai.confidence || 75,
    summary: ai.summary || 'Incidente operacional detectado.',
    severity_score: ai.severity_score || 70,
    channel: input.channel,
    created_at: input.timestamp || new Date().toISOString(),
  });

  const saved = await insertIncident(incident);

  if (shouldSendAlert(incident.groupKey)) {
    await sendWhatsAppAlert(saved);
    logger.warn('alert_sent', { id: saved.id, priority: saved.priority });
  } else {
    logger.info('alert_suppressed_by_cooldown', { groupKey: incident.groupKey });
  }

  return saved;
}

module.exports = { processIncomingMessage };
