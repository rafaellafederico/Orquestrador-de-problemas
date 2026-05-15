const { supabase } = require('./supabaseClient');

// Fields that exist in the incidents table
const DB_FIELDS = [
  'user',
  'message',
  'incident',
  'incident_type',
  'priority',
  'sector',
  'confidence',
  'severity_score',
  'grouped_count',
  'summary',
  'channel',
  'created_at',
];

function toDbRecord(incident) {
  const record = {};
  DB_FIELDS.forEach((field) => {
    if (incident[field] !== undefined) {
      record[field] = incident[field];
    }
  });
  return record;
}

async function insertIncident(record) {
  const { data, error } = await supabase
    .from('incidents')
    .insert([toDbRecord(record)])
    .select()
    .single();
  if (error) throw new Error(`supabase_insert_error: ${error.message}`);
  return data;
}

async function listRecentIncidents(limit = 30) {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`supabase_list_error: ${error.message}`);
  return data;
}

async function findDuplicates({ sector, incidentType, windowMinutes }) {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('incidents')
    .select('id, sector, incident_type, priority, created_at')
    .eq('sector', sector)
    .eq('incident_type', incidentType)
    .gte('created_at', since);
  if (error) throw new Error(`supabase_duplicates_error: ${error.message}`);
  return data || [];
}

module.exports = { insertIncident, listRecentIncidents, findDuplicates };
