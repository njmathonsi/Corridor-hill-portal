'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, UserCog } from 'lucide-react'
import { assignMaintenanceTicket, adminSetMaintenanceStatus, getSignedMaintenancePhotoUrl } from '@/lib/actions/maintenance'

type Status = 'pending' | 'assigned' | 'in_progress' | 'completed'

interface Worker { id: string; full_name: string }

interface Request {
  id: string
  category: string
  description: string
  status: Status
  reported_at: string
  photo_urls: string[] | null
  assigned_to: string | null
  profiles: { full_name: string; student_number: string } | null
  rooms: { room_number: string; units: { unit_code: string; blocks: { code: string } } } | null
}

const STATUS_STYLE: Record<Status, { bg: string; color: string; label: string }> = {
  pending:     { bg: 'rgb(var(--brand-rgb) / 0.15)', color: 'var(--brand)', label: 'Pending' },
  assigned:    { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Assigned' },
  in_progress: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7', label: 'In Progress' },
  completed:   { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Completed' },
}

const TABS: { key: Status | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
]

export default function MaintenanceQueue({ requests, workers }: { requests: Request[]; workers: Worker[] }) {
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const visible = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  function assign(id: string, workerId: string) {
    if (!workerId) return
    setPendingId(id)
    startTransition(async () => {
      await assignMaintenanceTicket(id, workerId)
      router.refresh()
      setPendingId(null)
    })
  }

  function overrideStatus(id: string, status: Status) {
    setPendingId(id)
    startTransition(async () => {
      await adminSetMaintenanceStatus(id, status)
      router.refresh()
      setPendingId(null)
    })
  }

  async function viewPhoto(path: string) {
    const { url } = await getSignedMaintenancePhotoUrl(path)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const sel: React.CSSProperties = { background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '6px 10px', borderRadius: 6, fontSize: 11, outline: 'none' }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const count = t.key === 'all' ? requests.length : requests.filter(r => r.status === t.key).length
          return (
            <button key={t.key} onClick={() => setFilter(t.key)} style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filter === t.key ? '#3b82f6' : '#27272a', color: filter === t.key ? '#fff' : '#a1a1aa', border: `1px solid ${filter === t.key ? '#3b82f6' : 'rgba(255,255,255,0.08)'}` }}>
              {t.label} · {count}
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div style={{ color: '#52525b', fontSize: 12, padding: '20px 0' }}>No requests in this view.</div>
      ) : visible.map((r, i) => {
        const s = STATUS_STYLE[r.status]
        const assignedWorker = workers.find(w => w.id === r.assigned_to)
        return (
          <div key={r.id} className="glass-card" style={{ padding: '14px 20px', marginBottom: 8, ['--stagger' as any]: i }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{r.category}</span>
                  <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                  {assignedWorker && (
                    <span style={{ fontSize: 10, color: '#71717a' }}>→ {assignedWorker.full_name}</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 6 }}>{r.description}</div>
                <div style={{ fontSize: 11, color: '#71717a' }}>
                  {r.profiles?.full_name ?? '—'} {r.profiles?.student_number ? `· ${r.profiles.student_number}` : ''} · Block {r.rooms?.units?.blocks?.code} · {r.rooms?.units?.unit_code} · {r.rooms?.room_number} · {new Date(r.reported_at).toLocaleDateString('en-ZA')}
                </div>
                {(r.photo_urls ?? []).length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {(r.photo_urls as string[]).map((p, pi) => (
                      <button key={p} onClick={() => viewPhoto(p)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#3b82f6', background: 'none', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                        <Camera size={12} /> Photo {pi + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <UserCog size={13} color="#71717a" />
                  <select
                    value={r.assigned_to ?? ''}
                    onChange={e => assign(r.id, e.target.value)}
                    disabled={pendingId === r.id || workers.length === 0}
                    style={sel}
                  >
                    <option value="" disabled>{workers.length === 0 ? 'No workers yet' : 'Assign to…'}</option>
                    {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                  </select>
                </label>
                {r.status !== 'pending' && (
                  <select
                    value={r.status}
                    onChange={e => overrideStatus(r.id, e.target.value as Status)}
                    disabled={pendingId === r.id}
                    style={{ ...sel, color: s.color }}
                  >
                    {TABS.filter(t => t.key !== 'all').map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
