import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MyPassesPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: transits } = await supabase
    .from('boundary_transits')
    .select('id, direction, transit_at, expected_return, destination, purpose, key_number')
    .eq('student_id', session.user.id)
    .order('transit_at', { ascending: false })
    .limit(50)

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>My Passes</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Your building entry and exit history</p>

      {(!transits || transits.length === 0) ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#52525b' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🚪</div>
          <div>No transit records yet.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {transits.map(t => (
            <div key={t.id} style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: t.direction === 'exit' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', border: `1px solid ${t.direction === 'exit' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: t.direction === 'exit' ? '#f59e0b' : '#10b981' }}>
                {t.direction === 'exit' ? '→' : '←'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.direction === 'exit' ? 'Departed' : 'Returned'}{t.destination ? ` · ${t.destination}` : ''}</div>
                {t.purpose && <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{t.purpose}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: '#a1a1aa', fontFamily: 'monospace' }}>{new Date(t.transit_at).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                {t.expected_return && <div style={{ fontSize: 10, color: '#52525b', marginTop: 2 }}>Return by {new Date(t.expected_return).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
                {t.key_number && <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 2, fontFamily: 'monospace' }}>🔑 {t.key_number}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
