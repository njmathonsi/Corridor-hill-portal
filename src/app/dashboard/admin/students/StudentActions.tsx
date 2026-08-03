'use client'
import { useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function StudentActions({ userId, isActive, fullName }: { userId: string; isActive: boolean; fullName: string }) {
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

  async function toggleActive() {
    if (!confirm(`${isActive ? 'Deactivate' : 'Activate'} ${fullName}?`)) return
    startTransition(async () => {
      await supabase.from('profiles').update({ is_active: !isActive }).eq('id', userId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={toggleActive}
      disabled={pending}
      className="glass-btn"
      style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, color: isActive ? '#f43f5e' : '#10b981', border: `1px solid ${isActive ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}`, opacity: pending ? 0.5 : 1 }}
    >
      {isActive ? 'Deactivate' : 'Activate'}
    </button>
  )
}
