import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdmin   = pathname.startsWith('/dashboard/admin')
  const isStudent = pathname.startsWith('/dashboard/student')

  // Check for Supabase auth cookie
  const authCookie = request.cookies.get('sb-kuprsnoavggiuycdoygt-auth-token')
  const hasSession = !!authCookie?.value

  if (!hasSession && (isAdmin || isStudent)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
}
