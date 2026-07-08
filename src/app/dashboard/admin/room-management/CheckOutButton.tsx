'use client'
import { useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CheckOutButton({ leaseId, studentName }: { leaseId: string; studentName: string }) {
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

  async function handleCheckOut() {
    if (!confirm(`Check out ${studentName}?`)) return
    startTransition(async () => {
      await supabase.from('leases').update({
        lease_status: 'Checked-Out',
        check_out_date: new Date().toISOString(),
        is_active: false,
      }).eq('id', leaseId)
      router.refresh()
    })
  }

  return (
    <button onClick={handleCheckOut} disabled={pending} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', fontSize: 10, fontWeight: 600, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.5 : 1 }}>
      {pending ? '…' : '🚪 Check Out'}
    </button>
  )
}
