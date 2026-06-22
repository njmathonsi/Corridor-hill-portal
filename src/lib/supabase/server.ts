import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function createClient() {
  const c = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return c.get(name)?.value },
        set(name: string, value: string, options: any) { c.set({ name, value, ...options }) },
        remove(name: string, options: any) { c.set({ name, value: '', ...options }) },
      },
    }
  )
}
