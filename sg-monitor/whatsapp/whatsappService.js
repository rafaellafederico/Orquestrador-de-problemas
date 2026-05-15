const axios = require('axios');
const { retry } = require('../utils/retry');

function formatTimestamp(isoString) {
  try {
    return new Date(isoString).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function buildAlertMessage(data) {
  const lines = [
    `Tipo: ${data.incident_type}`,
    `Prioridade: ${data.priority}`,
    `Confiança: ${Math.round(data.confidence)}%`,
    `Ocorrências(10min): ${data.grouped_count || 1}`,
    '',
    `Mensagem: "${data.message}"`,
    `Usuário: @${data.user}`,
    `Resumo: ${data.summary || '-'}`,
    `Horário: ${formatTimestamp(data.created_at)}`,
  ];
  return lines.join('\n');
}

function priorityToTag(priority) {
  const map = { CRITICAL: 'rotating_light', HIGH: 'warning', MEDIUM: 'bell', LOW: 'information_source' };
  return map[priority] || 'bell';
}

async function sendAlert(incident) {
  const topic = process.env.NTFY_TOPIC || 'sgmonitor-rafaella';
  const url = `https://ntfy.sh/${topic}`;

  await retry(
    () =>
      axios.post(url, buildAlertMessage(incident), {
        headers: {
          Title: `🚨 SG Alerta — ${incident.incident_type}`,
          Priority: incident.priority === 'CRITICAL' ? 'urgent' : incident.priority === 'HIGH' ? 'high' : 'default',
          Tags: priorityToTag(incident.priority),
          'Content-Type': 'text/plain',
        },
        timeout: Number(process.env.REQUEST_TIMEOUT_MS || 15000),
      }),
    { tries: 4, delayMs: 500 },
  );
}

module.exports = { sendAlert };
