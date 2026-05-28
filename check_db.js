import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxkiyfjfbidubajprwbp.supabase.co';
const supabaseKey = 'sb_publishable_Y9N2FzTD3aKVCetqvPA1Hw_Lx9Vbmma';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('pg_policies').select('*').eq('tablename', 'ai_consultations');
  console.log("POLICIES:", data, error);
}

check();
