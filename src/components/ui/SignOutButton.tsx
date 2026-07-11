'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button onClick={handleSignOut} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#71717a', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
      Sign Out
    </button>
  )
}
