// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/dashboard/student/home'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Determine role and route accordingly
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, onboarding_complete')
          .eq('id', session.user.id)
          .single()

        if (profile?.role === 'admin') {
          return NextResponse.redirect(`${origin}/dashboard/admin/overview`)
        }
        if (profile?.onboarding_complete) {
          return NextResponse.redirect(`${origin}/dashboard/student/home`)
        }
        return NextResponse.redirect(`${origin}/dashboard/student/onboarding/step-1-profile`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
