const { supabase } = require('./supabaseClient');

async function insertIncident(record) {
  const { data, error } = await supabase.from('incidents').insert([record]).select().single();
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
    .select('*')
    .eq('sector', sector)
    .eq('incident_type', incidentType)
    .gte('created_at', since);
  if (error) throw new Error(`supabase_duplicates_error: ${error.message}`);
  return data || [];
}

module.exports = { insertIncident, listRecentIncidents, findDuplicates };
