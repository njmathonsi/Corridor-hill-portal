import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DoorOpen, LogOut, LogIn, KeyRound } from 'lucide-react'

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
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
            <DoorOpen className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </div>
          <div>No transit records yet.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {transits.map((t, i) => (
            <div key={t.id} className="glass-card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, ['--stagger' as any]: i }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: t.direction === 'exit' ? 'rgb(var(--brand-rgb) / 0.15)' : 'rgba(16,185,129,0.15)', border: `1px solid ${t.direction === 'exit' ? 'rgb(var(--brand-rgb) / 0.3)' : 'rgba(16,185,129,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.direction === 'exit' ? 'var(--brand)' : '#10b981' }}>
                {t.direction === 'exit' ? <LogOut className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> : <LogIn className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.direction === 'exit' ? 'Departed' : 'Returned'}{t.destination ? ` · ${t.destination}` : ''}</div>
                {t.purpose && <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{t.purpose}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: '#a1a1aa', fontFamily: 'monospace' }}>{new Date(t.transit_at).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                {t.expected_return && <div style={{ fontSize: 10, color: '#52525b', marginTop: 2 }}>Return by {new Date(t.expected_return).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
                {t.key_number && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontSize: 10, color: 'var(--brand)', marginTop: 2, fontFamily: 'monospace' }}>
                    <KeyRound className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> {t.key_number}
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
