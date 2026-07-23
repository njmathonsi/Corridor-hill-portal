import { createClient } from '@/lib/supabase/server'
import ApplicationActions from './ApplicationActions'

export default async function ApplicationsPage() {
  const supabase = createClient()
  const { data: apps } = await supabase
    .from('applications')
    .select('id, status, academic_year, submitted_at, rejection_reason, student_id, profiles!applications_student_id_fkey(full_name, student_number, faculty, student_year_type, funding_type, email)')
    .order('submitted_at', { ascending: false })

  const statusColor: Record<string, { bg: string; color: string; border: string }> = {
    submitted:    { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
    under_review: { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    approved:     { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', border: 'rgba(16,185,129,0.3)' },
    rejected:     { bg: 'rgba(244,63,94,0.12)',   color: '#f43f5e', border: 'rgba(244,63,94,0.3)'  },
    draft:        { bg: 'rgba(255,255,255,0.05)', color: '#71717a', border: 'rgba(255,255,255,0.1)' },
  }

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Applications Queue</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Review, approve, and manage student accommodation applications</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {['submitted','under_review','approved','rejected'].map(s => {
          const count = (apps ?? []).filter(a => a.status === s).length
          const c = statusColor[s]
          return (
            <div key={s} style={{ flex: 1, background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: c.color }}>{count}</div>
              <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.replace('_',' ')}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(apps ?? []).length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#52525b', fontSize: 13 }}>No applications yet.</div>}
        {(apps ?? []).map(app => {
          const p = (app as any).profiles
          const c = statusColor[app.status] ?? statusColor.draft
          return (
            <div key={app.id} style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: app.status === 'submitted' || app.status === 'under_review' ? 14 : 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {p?.full_name?.split(' ').slice(0,2).map((n: string) => n[0]).join('') ?? '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa' }}>{p?.full_name ?? '—'}</div>
                  <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{p?.student_number} · {p?.faculty} · {app.academic_year} · {p?.student_year_type === 'first_year' ? 'First Year' : 'Senior'} · {p?.funding_type ?? '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                    {app.status.replace('_',' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                  <span style={{ fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-ZA') : 'Draft'}</span>
                </div>
              </div>

              {(app.status === 'submitted' || app.status === 'under_review') && (
                <ApplicationActions applicationId={app.id} studentId={app.student_id} studentName={p?.full_name ?? ''} />
              )}

              {app.status === 'rejected' && app.rejection_reason && (
                <div style={{ fontSize: 11, color: '#f43f5e', marginTop: 8, padding: '6px 10px', background: 'rgba(244,63,94,0.08)', borderRadius: 6 }}>Reason: {app.rejection_reason}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
