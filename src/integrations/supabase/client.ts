// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// ✅ Load environment variables from Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    '⚠️ Missing Supabase environment variables. Please check your .env file:\n' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be defined.'
  )
}

// ✅ Create the Supabase client
// Casting after creation prevents the “Type instantiation is excessively deep” error
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // helps handle magic link redirects
  },
}) as ReturnType<typeof createClient<Database>>

// ✅ Optional: export a typed helper for convenience
export type SupabaseClientType = typeof supabase
