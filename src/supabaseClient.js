import { createClient } from '@supabase/supabase-js'

// We will use Environment Variables so we don't expose secrets in code
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)