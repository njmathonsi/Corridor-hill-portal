import { createClient } from '@/lib/supabase/server'
import StudentActions from './StudentActions'

export default async function StudentsPage() {
  const supabase = createClient()
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, student_number, email, faculty, course, year_of_study, funding_type, onboarding_complete, is_active, role')
    .order('full_name')

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Students</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>{students?.filter(s => s.role === 'student').length ?? 0} registered students</p>

      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Name', 'Student No.', 'Email', 'Faculty', 'Year', 'Funding', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(students ?? []).map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#fafafa' }}>{s.full_name || '—'}</div>
                  {s.role === 'admin' && (
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)' }}>Admin</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', color: '#71717a', fontFamily: 'monospace' }}>{s.student_number ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: '#71717a', fontSize: 11 }}>{s.email}</td>
                <td style={{ padding: '12px 16px', color: '#a1a1aa' }}>{s.faculty ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: '#a1a1aa', textAlign: 'center' }}>{s.year_of_study ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: '#a1a1aa' }}>{s.funding_type ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: s.onboarding_complete ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: s.onboarding_complete ? '#10b981' : '#f59e0b', border: `1px solid ${s.onboarding_complete ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                    {s.onboarding_complete ? 'Active' : 'Onboarding'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <StudentActions
                    userId={s.id}
                    currentRole={s.role}
                    isActive={s.is_active}
                    fullName={s.full_name}
                  />
                </td>
              </tr>
            ))}
            {(students ?? []).length === 0 && (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#52525b' }}>No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
