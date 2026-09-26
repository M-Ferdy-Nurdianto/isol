import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseInstance = null

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables. Real-time updates will be disabled.')
} else {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
  }
}

export const supabase = supabaseInstance
