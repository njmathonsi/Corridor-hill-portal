'use client'
// components/applications/ApplicationsQueue.tsx
import { useState, useTransition } from 'react'
import { reviewApplication } from '@/lib/actions/applications'
import { useToast } from '@/components/ui/use-toast'

type AppStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'draft'

interface Application {
  id: string
  status: AppStatus
  academic_year: string
  submitted_at: string | null
  financial_cleared: boolean
  financial_status: string | null
  rejection_reason: string | null
  proof_of_registration_url: string | null
  id_copy_url: string | null
  sport_achievements: string | null
  cultural_achievements: string | null
  leadership_roles: string | null
  medical_conditions: string | null
  disability_info: string | null
  current_academic_average: number | null
  preferred_block: string | null
  preferred_room_type: string | null
  admin_notes: string | null
  reviewed_at: string | null
  profiles: {
    id: string
    full_name: string
    student_number: string
    id_number: string | null
    email: string
    phone: string | null
    faculty: string | null
    course: string | null
    year_of_study: number | null
    student_year_type: 'first_year' | 'senior' | null
    funding_type: string | null
    onboarding_complete: boolean
  } | null
}

const TABS: { key: AppStatus | 'all'; label: string }[] = [
  { key: 'submitted',    label: 'New' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved',     label: 'Approved' },
  { key: 'rejected',     label: 'Rejected' },
  { key: 'all',          label: 'All' },
]

function StatusBadge({ status }: { status: AppStatus }) {
  const map: Record<AppStatus, { bg: string; color: string; ring: string; label: string }> = {
    submitted:    { bg: 'var(--blue-dim)',    color: 'var(--blue)',    ring: 'var(--blue-ring)',    label: 'New' },
    under_review: { bg: 'var(--amber-dim)',   color: 'var(--amber)',   ring: 'var(--amber-ring)',   label: 'Under Review' },
    approved:     { bg: 'var(--emerald-dim)', color: 'var(--emerald)', ring: 'var(--emerald-ring)', label: 'Approved' },
    rejected:     { bg: 'var(--rose-dim)',    color: 'var(--rose)',    ring: 'var(--rose-ring)',    label: 'Rejected' },
    draft:        { bg: 'var(--bg-raised)',   color: 'var(--text-tertiary)', ring: 'var(--border-dim)', label: 'Draft' },
  }
  const s = map[status]
  return (
    <span style={{
      display: 'inline-flex', padding: '3px 8px', borderRadius: 99,
      fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.ring}`,
    }}>{s.label}</span>
  )
}

interface Props {
  groups: Record<AppStatus, Application[]>
}

export default function ApplicationsQueue({ groups }: Props) {
  const [activeTab, setActiveTab]   = useState<AppStatus | 'all'>('submitted')
  const [selected, setSelected]     = useState<Application | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const displayed = activeTab === 'all'
    ? Object.values(groups).flat()
    : groups[activeTab] ?? []

  function handleSelect(app: Application) {
    setSelected(app)
    setRejectReason(app.rejection_reason ?? '')
    setAdminNotes(app.admin_notes ?? '')
  }

  function handleAction(action: 'approve' | 'reject' | 'flag_review') {
    if (!selected) return
    if (action === 'reject' && !rejectReason.trim()) {
      toast({ title: 'Reason required', description: 'Please enter a rejection reason', variant: 'destructive' })
      return
    }
    startTransition(async () => {
      const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'under_review'
      const result = await reviewApplication({
        applicationId: selected.id,
        status: newStatus,
        rejectionReason: action === 'reject' ? rejectReason : undefined,
        adminNotes,
      })
      if (result.success) {
        toast({
          title: action === 'approve' ? '✅ Application Approved' : action === 'reject' ? '❌ Application Rejected' : '🔍 Marked for Review',
          description: `${selected.profiles?.full_name} · ${selected.academic_year}`,
        })
        setSelected(null)
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    })
  }

  const inputStyle = {
    background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
    color: 'var(--text-primary)', padding: '8px 10px',
    borderRadius: 'var(--r-md)', fontSize: 12, fontFamily: 'inherit',
    width: '100%', outline: 'none',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16 }}>
      {/* Left: list */}
      <div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'var(--bg-raised)', padding: 4, borderRadius: 'var(--r-md)', width: 'fit-content', border: '1px solid var(--border-dim)' }}>
          {TABS.map(tab => {
            const count = tab.key === 'all' ? Object.values(groups).flat().length : groups[tab.key as AppStatus]?.length ?? 0
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '5px 12px', borderRadius: 6,
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: 'none',
                  background: activeTab === tab.key ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span style={{
                    marginLeft: 5, fontSize: 10, fontWeight: 700,
                    background: activeTab === tab.key ? 'var(--blue-dim)' : 'var(--bg-raised)',
                    color: activeTab === tab.key ? 'var(--blue)' : 'var(--text-disabled)',
                    padding: '1px 5px', borderRadius: 99,
                  }}>{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Applications list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-disabled)', fontSize: 13 }}>
              No applications in this category.
            </div>
          ) : displayed.map(app => {
            const p = app.profiles
            const isSelected = selected?.id === app.id
            return (
              <div
                key={app.id}
                onClick={() => handleSelect(app)}
                style={{
                  background: 'var(--bg-card)', borderRadius: 'var(--r-lg)', padding: '12px 16px',
                  border: `1px solid ${isSelected ? 'var(--blue-ring)' : 'var(--border-dim)'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--blue), var(--violet))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                }}>
                  {p?.full_name?.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase() ?? '?'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p?.full_name ?? 'Unknown'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, display: 'flex', gap: 10 }}>
                    <span>{p?.student_number ?? '—'}</span>
                    <span>·</span>
                    <span>{p?.faculty ?? '—'}</span>
                    <span>·</span>
                    <span>{app.academic_year}</span>
                  </div>
                </div>

                {/* Type chip */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  <StatusBadge status={app.status} />
                  <span style={{
                    fontSize: 10, color: 'var(--text-tertiary)',
                    background: 'var(--bg-raised)', border: '1px solid var(--border-dim)',
                    padding: '2px 6px', borderRadius: 4,
                  }}>
                    {p?.student_year_type === 'first_year' ? '1st Year' : 'Senior'} · {p?.funding_type ?? '—'}
                  </span>
                </div>

                {/* Date */}
                <div style={{
                  flexShrink: 0, fontSize: 11,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'var(--text-disabled)',
                }}>
                  {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-ZA') : 'Draft'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: review panel */}
      {selected && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--blue-ring)',
          borderRadius: 'var(--r-lg)', padding: 16,
          position: 'sticky', top: 0, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Application Review</div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>

          {/* Student info */}
          <div style={{ marginBottom: 14, padding: '10px 12px', background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{selected.profiles?.full_name}</div>
            {[
              ['Student No.',  selected.profiles?.student_number],
              ['Email',        selected.profiles?.email],
              ['Phone',        selected.profiles?.phone],
              ['Faculty',      selected.profiles?.faculty],
              ['Course',       selected.profiles?.course],
              ['Year',         selected.profiles?.year_of_study],
              ['Type',         selected.profiles?.student_year_type === 'first_year' ? 'First Year' : 'Senior'],
              ['Funding',      selected.profiles?.funding_type],
            ].map(([k, v]) => v && (
              <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{k}</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{String(v)}</span>
              </div>
            ))}
          </div>

          {/* First-year fields */}
          {selected.profiles?.student_year_type === 'first_year' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 6 }}>First-Year Fields</div>
              {[
                ['Sport Achievements',    selected.sport_achievements],
                ['Cultural Achievements', selected.cultural_achievements],
                ['Leadership Roles',      selected.leadership_roles],
                ['Medical Conditions',    selected.medical_conditions],
                ['Disability Info',       selected.disability_info],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string} style={{ fontSize: 11, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{k}: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{String(v)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Senior field */}
          {selected.profiles?.student_year_type === 'senior' && selected.current_academic_average != null && (
            <div style={{ marginBottom: 14, padding: '10px 12px', background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Academic Average</div>
              <div style={{
                fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em',
                color: Number(selected.current_academic_average) >= 60 ? 'var(--emerald)' : 'var(--amber)',
              }}>
                {selected.current_academic_average}%
              </div>
            </div>
          )}

          {/* Documents */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 6 }}>Documents</div>
            {[
              { label: 'Proof of Registration', url: selected.proof_of_registration_url },
              { label: 'ID Copy',               url: selected.id_copy_url },
            ].map(doc => (
              <div key={doc.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 10px', borderRadius: 'var(--r-md)',
                background: 'var(--bg-raised)', border: '1px solid var(--border-dim)', marginBottom: 4,
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{doc.label}</span>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noreferrer" style={{
                    fontSize: 11, color: 'var(--blue)', fontWeight: 600, textDecoration: 'none',
                  }}>View →</a>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--rose)' }}>Not uploaded</span>
                )}
              </div>
            ))}
          </div>

          {/* Financial status toggle */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 6 }}>Financial Status</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['cleared', 'outstanding', 'pending_nsfas'].map(fs => (
                <button
                  key={fs}
                  onClick={() => {/* handled in review action */}}
                  style={{
                    flex: 1, padding: '6px', borderRadius: 'var(--r-sm)',
                    fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    border: '1px solid',
                    background: selected.financial_status === fs
                      ? fs === 'cleared' ? 'var(--emerald-dim)' : fs === 'outstanding' ? 'var(--rose-dim)' : 'var(--amber-dim)'
                      : 'var(--bg-raised)',
                    color: selected.financial_status === fs
                      ? fs === 'cleared' ? 'var(--emerald)' : fs === 'outstanding' ? 'var(--rose)' : 'var(--amber)'
                      : 'var(--text-disabled)',
                    borderColor: selected.financial_status === fs
                      ? fs === 'cleared' ? 'var(--emerald-ring)' : fs === 'outstanding' ? 'var(--rose-ring)' : 'var(--amber-ring)'
                      : 'var(--border-dim)',
                    textTransform: 'capitalize',
                  }}
                >
                  {fs.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Admin notes */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Admin Notes</label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Internal notes (not visible to student)…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Rejection reason */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--rose)', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Reason for Rejection</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Required if rejecting this application…"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', borderColor: rejectReason ? 'var(--rose-ring)' : undefined }}
            />
          </div>

          {/* Action buttons */}
          {selected.status !== 'approved' && selected.status !== 'rejected' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => handleAction('approve')}
                disabled={isPending}
                style={{
                  padding: '10px', borderRadius: 'var(--r-md)',
                  background: 'var(--emerald)', color: '#fff',
                  border: '1px solid var(--emerald)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', opacity: isPending ? 0.5 : 1,
                }}
              >
                ✓ Approve Application
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleAction('flag_review')}
                  disabled={isPending}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 'var(--r-md)',
                    background: 'transparent', border: '1px solid var(--amber-ring)',
                    color: 'var(--amber)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    opacity: isPending ? 0.5 : 1,
                  }}
                >
                  🔍 Flag for Review
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={isPending}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 'var(--r-md)',
                    background: 'transparent', border: '1px solid var(--rose-ring)',
                    color: 'var(--rose)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    opacity: isPending ? 0.5 : 1,
                  }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          )}

          {(selected.status === 'approved' || selected.status === 'rejected') && (
            <div style={{
              padding: '10px 12px', borderRadius: 'var(--r-md)',
              background: selected.status === 'approved' ? 'var(--emerald-dim)' : 'var(--rose-dim)',
              border: `1px solid ${selected.status === 'approved' ? 'var(--emerald-ring)' : 'var(--rose-ring)'}`,
              fontSize: 12, fontWeight: 600,
              color: selected.status === 'approved' ? 'var(--emerald)' : 'var(--rose)',
              textAlign: 'center',
            }}>
              {selected.status === 'approved' ? '✓ Application Approved' : '✕ Application Rejected'}
              {selected.reviewed_at && (
                <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7, marginTop: 3 }}>
                  {new Date(selected.reviewed_at).toLocaleDateString('en-ZA')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
