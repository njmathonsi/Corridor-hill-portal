import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// SERVER-ONLY. Uses the service_role key, which bypasses RLS entirely.
// Never import this file from a Client Component or expose SUPABASE_SERVICE_ROLE_KEY
// with a NEXT_PUBLIC_ prefix — that would ship full database access to the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
