import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MyBiometricsPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: bio } = await supabase
    .from('biometric_registrations')
    .select('biometric_registered, sync_status, registered_at, device_label, device_type, last_synced_at')
    .eq('student_id', session.user.id)
    .limit(5)

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>My Biometrics</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Your biometric registration status and device information</p>

      {(!bio || bio.length === 0) ? (
        <div style={{ background: '#18181b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🪪</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>Not Registered</div>
          <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6 }}>
            You have not completed biometric registration yet.<br/>
            Please visit the reception desk within 5 days of check-in to complete this process.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bio.map((b, i) => (
            <div key={i} style={{ background: '#18181b', border: `1px solid ${b.biometric_registered ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: b.biometric_registered ? '#10b981' : '#f59e0b' }}>
                  {b.biometric_registered ? '✓ Registered' : '⚠ Pending'}
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: b.sync_status === 'synced' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: b.sync_status === 'synced' ? '#10b981' : '#f59e0b', border: `1px solid ${b.sync_status === 'synced' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                  {b.sync_status}
                </span>
              </div>
              {[
                ['Device', b.device_label],
                ['Device Type', b.device_type],
                ['Registered', b.registered_at ? new Date(b.registered_at).toLocaleDateString('en-ZA') : null],
                ['Last Synced', b.last_synced_at ? new Date(b.last_synced_at).toLocaleDateString('en-ZA') : null],
              ].filter(([,v]) => v).map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                  <span style={{ color: '#71717a' }}>{k}</span>
                  <span style={{ color: '#fafafa', fontWeight: 500 }}>{String(v)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
