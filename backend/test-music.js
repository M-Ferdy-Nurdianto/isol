import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function test() {
  const { data, error } = await supabase.from('music_items').select('*').order('order', { ascending: true }).order('created_at', { ascending: false });
  console.log('Error:', error);
  console.log('Data:', data);
}
test();
