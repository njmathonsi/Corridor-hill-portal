'use client'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, Hand, PlayCircle, CheckCircle2 } from 'lucide-react'
import { claimMaintenanceTicket, startMaintenanceTicket, completeMaintenanceTicket, getSignedMaintenancePhotoUrl } from '@/lib/actions/maintenance'

type Status = 'pending' | 'assigned' | 'in_progress' | 'completed'

interface Ticket {
  id: string
  category: string
  description: string
  status: Status
  reported_at: string
  assigned_to: string | null
  photo_urls: string[] | null
  profiles: { full_name: string; student_number: string } | null
  rooms: { room_number: string; units: { unit_code: string; blocks: { code: string } } } | null
}

const STATUS_STYLE: Record<Status, { bg: string; color: string; label: string }> = {
  pending:     { bg: 'rgb(var(--brand-rgb) / 0.15)', color: 'var(--brand)', label: 'Pending' },
  assigned:    { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Assigned' },
  in_progress: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7', label: 'In Progress' },
  completed:   { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Completed' },
}

export default function TicketBoard({ open, mine, completed, myId }: { open: Ticket[]; mine: Ticket[]; completed: Ticket[]; myId: string }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [live, setLive] = useState(false)

  // Realtime: any insert/update on maintenance_requests visible to this worker
  // (open tickets + anything assigned to them, per RLS) refreshes the board.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('maintenance-worker-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, () => {
        router.refresh()
      })
      .subscribe(status => setLive(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [router])

  function run(id: string, action: (id: string) => Promise<any>) {
    setPendingId(id)
    startTransition(async () => {
      await action(id)
      router.refresh()
      setPendingId(null)
    })
  }

  async function viewPhoto(path: string) {
    const { url } = await getSignedMaintenancePhotoUrl(path)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  function TicketCard({ t, action }: { t: Ticket; action?: { label: string; icon: React.ReactNode; run: () => void } }) {
    const s = STATUS_STYLE[t.status]
    return (
      <div className="glass-card" style={{ padding: '14px 18px', marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{t.category}</span>
              <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 6 }}>{t.description}</div>
            <div style={{ fontSize: 11, color: '#71717a' }}>
              {t.profiles?.full_name ?? '—'} · Block {t.rooms?.units?.blocks?.code} · {t.rooms?.units?.unit_code} · {t.rooms?.room_number} · {new Date(t.reported_at).toLocaleDateString('en-ZA')}
            </div>
            {(t.photo_urls ?? []).length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {(t.photo_urls as string[]).map((p, pi) => (
                  <button key={p} onClick={() => viewPhoto(p)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#3b82f6', background: 'none', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                    <Camera size={12} /> Photo {pi + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
          {action && (
            <button onClick={action.run} disabled={pendingId === t.id} className="glass-btn group" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', opacity: pendingId === t.id ? 0.5 : 1 }}>
              {action.icon} {action.label}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: live ? '#10b981' : '#52525b', display: 'inline-block' }} />
        <span style={{ fontSize: 10, color: '#71717a' }}>{live ? 'Live — board updates automatically' : 'Connecting…'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#71717a', marginBottom: 10 }}>
            Open Tickets — {open.length}
          </div>
          {open.length === 0 ? (
            <div style={{ color: '#52525b', fontSize: 12, padding: '12px 0' }}>Nothing waiting to be claimed.</div>
          ) : open.map(t => (
            <TicketCard key={t.id} t={t} action={{ label: 'Claim Task', icon: <Hand className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />, run: () => run(t.id, claimMaintenanceTicket) }} />
          ))}
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#71717a', marginBottom: 10 }}>
            My Active Tickets — {mine.length}
          </div>
          {mine.length === 0 ? (
            <div style={{ color: '#52525b', fontSize: 12, padding: '12px 0' }}>Nothing assigned to you right now.</div>
          ) : mine.map(t => (
            <TicketCard
              key={t.id}
              t={t}
              action={
                t.status === 'in_progress'
                  ? { label: 'Mark as Done', icon: <CheckCircle2 className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />, run: () => run(t.id, completeMaintenanceTicket) }
                  : { label: 'Start Work', icon: <PlayCircle className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />, run: () => run(t.id, startMaintenanceTicket) }
              }
            />
          ))}

          {completed.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#71717a', marginTop: 20, marginBottom: 10 }}>
                Completed by Me — {completed.length}
              </div>
              {completed.map(t => <TicketCard key={t.id} t={t} />)}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
