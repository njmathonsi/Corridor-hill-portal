import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportIssueForm from './ReportIssueForm'

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:     { bg: 'rgb(var(--brand-rgb) / 0.15)', color: 'var(--brand)', label: 'Pending' },
  assigned:    { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Assigned' },
  in_progress: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7', label: 'In Progress' },
  completed:   { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Completed' },
}

export default async function ReportIssuePage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: requests } = await supabase
    .from('maintenance_requests')
    .select('id, category, description, status, reported_at, profiles!maintenance_requests_assigned_to_fkey(full_name)')
    .eq('student_id', session.user.id)
    .order('reported_at', { ascending: false })

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Report an Issue</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Let maintenance know about a problem in your room</p>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <ReportIssueForm />

        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#71717a', marginBottom: 10 }}>
            Your Reports — {requests?.length ?? 0}
          </div>
          {(!requests || requests.length === 0) ? (
            <div style={{ color: '#52525b', fontSize: 12 }}>No issues reported yet.</div>
          ) : requests.map((r: any, i) => {
            const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending
            return (
              <div key={r.id} className="glass-card" style={{ padding: '12px 16px', marginBottom: 8, ['--stagger' as any]: i }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.category}</div>
                  <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 4 }}>{r.description}</div>
                <div style={{ fontSize: 10, color: '#71717a', marginTop: 6 }}>
                  {new Date(r.reported_at).toLocaleDateString('en-ZA')}
                  {r.profiles?.full_name && ` · Assigned to ${r.profiles.full_name}`}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
