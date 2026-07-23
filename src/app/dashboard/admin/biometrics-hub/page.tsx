import { createClient } from '@/lib/supabase/server'
import BiometricsActions from './BiometricsActions'

export default async function BiometricsHubPage({ searchParams }: { searchParams: { registerStudent?: string } }) {
  const supabase = createClient()
  const { data: students } = await supabase.from('profiles').select('id, full_name, student_number, email').eq('role', 'student').order('full_name')
  const { data: regs } = await supabase.from('biometric_registrations').select('id, student_id, biometric_registered, sync_status, registered_at, device_label')

  const regMap: Record<string, any> = {}
  for (const r of regs ?? []) regMap[r.student_id] = r

  const registered = (students ?? []).filter(s => regMap[s.id]?.biometric_registered).length
  const pending = (students ?? []).filter(s => !regMap[s.id]?.biometric_registered).length

  const guidedStudent = searchParams.registerStudent ? (students ?? []).find(s => s.id === searchParams.registerStudent) : null

  return (
    <div style={{ padding: 28 }}>
      {guidedStudent && (
        <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 12, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🪪</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>Register biometrics for {guidedStudent.full_name}</div>
            <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 2 }}>Room has been assigned. Complete onboarding by registering their biometrics below.</div>
          </div>
        </div>
      )}

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Biometrics Hub</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Manage student biometric registration and device sync</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Registered', value: registered, color: '#10b981' },
          { label: 'Pending', value: pending, color: '#f59e0b' },
          { label: 'Total', value: students?.length ?? 0, color: '#fafafa' },
        ].map(t => (
          <div key={t.label} style={{ flex: 1, background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: t.color }}>{t.value}</div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Student', 'Student No.', 'Status', 'Device', 'Registered', 'Action'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(students ?? []).map(s => {
              const reg = regMap[s.id]
              const isRegistered = reg?.biometric_registered
              const isGuided = guidedStudent?.id === s.id
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isGuided ? 'rgba(59,130,246,0.06)' : 'transparent' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fafafa' }}>{s.full_name} {isGuided && <span style={{ marginLeft: 6, fontSize: 10, color: '#3b82f6' }}>← Register this one</span>}</td>
                  <td style={{ padding: '12px 16px', color: '#71717a', fontFamily: 'monospace' }}>{s.student_number ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: isRegistered ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: isRegistered ? '#10b981' : '#f59e0b', border: `1px solid ${isRegistered ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                      {isRegistered ? 'Registered' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#71717a' }}>{reg?.device_label ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#71717a', fontFamily: 'monospace', fontSize: 11 }}>{reg?.registered_at ? new Date(reg.registered_at).toLocaleDateString('en-ZA') : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <BiometricsActions studentId={s.id} studentName={s.full_name} isRegistered={!!isRegistered} registrationId={reg?.id ?? null} />
                  </td>
                </tr>
              )
            })}
            {(students ?? []).length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#52525b' }}>No students registered yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
