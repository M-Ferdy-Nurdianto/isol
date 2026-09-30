import * as dotenv from 'dotenv'
dotenv.config()
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE music_items DROP COLUMN IF EXISTS description;' })
  if (error) {
    console.error('RPC failed, trying raw rest via select if possible. But better yet, I should run it with pg.')
    console.error(error)
  } else {
    console.log('Success!', data)
  }
}
run()
