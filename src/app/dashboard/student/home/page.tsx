import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentHomePage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const [{ data: profile }, { data: lease }, { data: bio }, { data: offences }, { data: ack }] = await Promise.all([
    supabase.from('profiles').select('full_name, student_number, onboarding_complete').eq('id', session.user.id).single(),
    supabase.from('leases').select('lease_status, assigned_key_number, rooms(room_number, units(unit_code, blocks(code)))').eq('student_id', session.user.id).eq('is_active', true).limit(1).single(),
    supabase.from('biometric_registrations').select('biometric_registered, sync_status').eq('student_id', session.user.id).limit(1).single(),
    supabase.from('offences_log').select('id, fine_amount_applied').eq('student_id', session.user.id),
    supabase.from('conduct_acknowledgements').select('is_verified').eq('student_id', session.user.id).limit(1).single(),
  ])

  const totalFines = (offences ?? []).reduce((s, o) => s + Number(o.fine_amount_applied ?? 0), 0)

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Student'} 👋</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Corridor Hill Residence · {profile?.student_number ?? '—'}</p>

      {/* Onboarding banner */}
      {!profile?.onboarding_complete && (
        <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 10, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', marginBottom: 10 }}>Complete your onboarding to activate your room</div>
          {[
            { step: 1, label: 'Personal Profile',   href: '/dashboard/student/onboarding/step-1', done: !!(profile?.full_name) },
            { step: 4, label: 'Code of Conduct',    href: '/dashboard/student/onboarding/step-4', done: !!ack },
          ].map(s => (
            <a key={s.step} href={s.href}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, marginBottom: 6, background: s.done ? 'rgba(16,185,129,0.1)' : '#1f1f23', border: `1px solid ${s.done ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.done ? '#10b981' : '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: s.done ? '#fff' : '#71717a', flexShrink: 0 }}>{s.done ? '✓' : s.step}</div>
                <span style={{ fontSize: 12, color: s.done ? '#10b981' : '#fafafa' }}>{s.label}</span>
                {!s.done && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#3b82f6' }}>→ Start</span>}
              </div>
            </a>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        {/* Room card */}
        <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>My Room</div>
          {lease ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Block {(lease.rooms as any)?.units?.blocks?.code} · {(lease.rooms as any)?.room_number}
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>{lease.lease_status}</span>
              {lease.assigned_key_number && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 10, fontFamily: 'monospace' }}>🔑 {lease.assigned_key_number}</div>}
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#52525b' }}>No room assigned yet. Management will assign your room once your application is approved.</div>
          )}
        </div>

        {/* Biometrics card */}
        <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Biometrics</div>
          {bio?.biometric_registered ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>✓ Registered</div>
              <div style={{ fontSize: 11, color: '#71717a' }}>Sync: <span style={{ color: bio.sync_status === 'synced' ? '#10b981' : '#f59e0b' }}>{bio.sync_status}</span></div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f59e0b', marginBottom: 6 }}>⚠ Not Registered</div>
              <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>Visit reception to register within 5 days of check-in.</div>
            </>
          )}
        </div>
      </div>

      {/* Conduct summary */}
      <div style={{ background: '#18181b', border: `1px solid ${totalFines > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Conduct Record</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: (offences?.length ?? 0) > 0 ? '#f43f5e' : '#10b981' }}>{offences?.length ?? 0}</div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>OFFENCES</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: totalFines > 0 ? '#f59e0b' : '#10b981' }}>R {totalFines.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>TOTAL FINES</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: ack?.is_verified ? '#10b981' : '#f59e0b' }}>{ack?.is_verified ? '✓' : '⏳'}</div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>COC STATUS</div>
          </div>
        </div>
      </div>
    </div>
  )
}
