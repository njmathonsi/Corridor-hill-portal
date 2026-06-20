// ════════════════════════════════════════════════════════
// app/dashboard/student/my-passes/page.tsx
// ════════════════════════════════════════════════════════
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MyPassesPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: transits } = await supabase
    .from('boundary_transits')
    .select('id, direction, transit_at, expected_return, destination, purpose, key_number, key_handed_over, key_returned')
    .eq('student_id', session.user.id)
    .order('transit_at', { ascending: false })
    .limit(50)

  return (
    <div className="animate-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>My Passes</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
          Your building entry and exit history
        </p>
      </div>

      {(!transits || transits.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-disabled)', fontSize: 13 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🚪</div>
          No transit records yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {transits.map(t => (
            <div key={t.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-dim)',
              borderRadius: 'var(--r-lg)', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: t.direction === 'exit' ? 'var(--amber-dim)' : 'var(--emerald-dim)',
                border: `1px solid ${t.direction === 'exit' ? 'var(--amber-ring)' : 'var(--emerald-ring)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>
                {t.direction === 'exit' ? '→' : '←'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {t.direction === 'exit' ? 'Departed' : 'Returned'}
                  {t.destination ? ` · ${t.destination}` : ''}
                </div>
                {t.purpose && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{t.purpose}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {new Date(t.transit_at).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
                {t.expected_return && (
                  <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 2 }}>
                    Return by {new Date(t.expected_return).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                {t.key_number && (
                  <div style={{ fontSize: 10, color: 'var(--amber)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                    🔑 {t.key_number}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ════════════════════════════════════════════════════════
// app/dashboard/student/my-biometrics/page.tsx  (export separately)
// ════════════════════════════════════════════════════════
export async function MyBiometricsPage_SERVER() {
  // This pattern shows how the file would look — export in its own file
  const supabase = createClient()
  const { data: { session } } = await (supabase as any).auth.getSession()

  const { data: bio } = await supabase
    .from('biometric_registrations')
    .select('biometric_registered, sync_status, registered_at, device_label, device_type, last_synced_at')
    .eq('student_id', session!.user.id)
    .limit(5)

  return bio
}
