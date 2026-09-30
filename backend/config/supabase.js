import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const defaultLocalUrl = 'http://127.0.0.1:54321'
const defaultLocalServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const envUrl = process.env.SUPABASE_URL
const envKey = process.env.SUPABASE_SERVICE_KEY

const supabaseUrl = (envUrl && !envUrl.includes('placeholder')) ? envUrl : defaultLocalUrl
const supabaseServiceKey = (envKey && !envKey.includes('your_supabase') && !envKey.includes('placeholder')) ? envKey : defaultLocalServiceKey

console.log('--- Supabase Config Init ---')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists & valid format:', Boolean(supabaseServiceKey && supabaseServiceKey.includes('.')))
console.log('----------------------------')

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
