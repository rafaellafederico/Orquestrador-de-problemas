const { findDuplicates } = require('../database/incidentsRepository');

const alertCooldown = new Map();

function upgradePriority(priority) {
  const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const idx = order.indexOf(priority);
  return order[Math.min(idx + 1, order.length - 1)] || 'HIGH';
}

async function enrichWithDedup(incident) {
  const windowMinutes = Number(process.env.DUPLICATE_WINDOW_MINUTES || 10);
  const threshold = Number(process.env.DUPLICATE_THRESHOLD || 5);
  const duplicates = await findDuplicates({
    sector: incident.sector,
    incidentType: incident.incident_type,
    windowMinutes,
  });

  const groupedCount = duplicates.length + 1;
  let priority = incident.priority;
  let severity = incident.severity_score;

  if (groupedCount >= threshold) {
    priority = upgradePriority(priority);
    severity = Math.min(100, severity + 15);
  }

  const groupKey = `${incident.sector}:${incident.incident_type}`;
  return { ...incident, groupedCount, priority, severity_score: severity, groupKey };
}

function shouldSendAlert(groupKey) {
  const cooldownMinutes = Number(process.env.ALERT_COOLDOWN_MINUTES || 15);
  const last = alertCooldown.get(groupKey);
  const now = Date.now();
  if (!last || now - last > cooldownMinutes * 60 * 1000) {
    alertCooldown.set(groupKey, now);
    return true;
  }
  return false;
}

module.exports = { enrichWithDedup, shouldSendAlert };
