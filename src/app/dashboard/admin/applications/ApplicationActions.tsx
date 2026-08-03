'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, Search, X } from 'lucide-react'

export default function ApplicationActions({ applicationId, studentId, studentName }: { applicationId: string; studentId: string; studentName: string }) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

  async function handleApprove() {
    startTransition(async () => {
      await supabase.from('applications').update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      }).eq('id', applicationId)

      // Guided workflow: approve → go straight to Room Management with this student pre-selected
      router.push(`/dashboard/admin/room-management?assignStudent=${studentId}`)
    })
  }

  async function handleReview() {
    startTransition(async () => {
      await supabase.from('applications').update({ status: 'under_review', reviewed_at: new Date().toISOString() }).eq('id', applicationId)
      router.refresh()
    })
  }

  async function handleReject() {
    if (!rejectionReason.trim()) return
    startTransition(async () => {
      await supabase.from('applications').update({ status: 'rejected', rejection_reason: rejectionReason, reviewed_at: new Date().toISOString() }).eq('id', applicationId)
      setShowReject(false)
      router.refresh()
    })
  }

  const btn = (label: string, icon: React.ReactNode, onClick: () => void, color: string, border: string) => (
    <button onClick={onClick} disabled={pending} className="glass-btn group" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, color, border: `1px solid ${border}`, opacity: pending ? 0.5 : 1, cursor: pending ? 'not-allowed' : 'pointer' }}>{icon}{label}</button>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {btn('Approve → Assign Room', <Check className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />, handleApprove, '#10b981', 'rgba(16,185,129,0.3)')}
        {btn('Flag for Review', <Search className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />, handleReview, '#f59e0b', 'rgba(245,158,11,0.3)')}
        {btn('Reject', <X className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />, () => setShowReject(!showReject), '#f43f5e', 'rgba(244,63,94,0.3)')}
      </div>
      {showReject && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <input value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Reason for rejection…" style={{ flex: 1, background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '8px 12px', borderRadius: 8, fontSize: 12, outline: 'none' }} />
          <button onClick={handleReject} disabled={!rejectionReason.trim() || pending} style={{ padding: '8px 14px', borderRadius: 8, background: '#f43f5e', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: !rejectionReason.trim() ? 0.4 : 1 }}>Confirm</button>
        </div>
      )}
    </div>
  )
}
