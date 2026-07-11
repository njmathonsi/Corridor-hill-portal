import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function StudentHomePage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const [{ data: profile }, { data: lease }, { data: bio }, { data: offences }, { data: ack }, { data: application }] = await Promise.all([
    supabase.from('profiles').select('full_name, student_number, onboarding_complete').eq('id', session.user.id).single(),
    supabase.from('leases').select('lease_status, assigned_key_number, rooms(room_number, units(unit_code, blocks(code)))').eq('student_id', session.user.id).eq('is_active', true).limit(1).single(),
    supabase.from('biometric_registrations').select('biometric_registered, sync_status').eq('student_id', session.user.id).limit(1).single(),
    supabase.from('offences_log').select('id, fine_amount_applied').eq('student_id', session.user.id),
    supabase.from('conduct_acknowledgements').select('is_verified').eq('student_id', session.user.id).limit(1).single(),
    supabase.from('applications').select('id, status, academic_year').eq('student_id', session.user.id).order('created_at', { ascending: false }).limit(1).single(),
  ])

  const totalFines = (offences ?? []).reduce((s, o) => s + Number(o.fine_amount_applied ?? 0), 0)
  const statusColor: Record<string,string> = { submitted:'#3b82f6', under_review:'#f59e0b', approved:'#10b981', rejected:'#f43f5e', draft:'#71717a' }

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Student'} 👋</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Corridor Hill Residence · {profile?.student_number ?? '—'}</p>

      {/* Application CTA or status */}
      {!application ? (
        <Link href="/dashboard/student/apply">
          <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(139,92,246,0.15))', border: '1px solid rgba(59,130,246,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6', marginBottom: 3 }}>📥 Apply for Accommodation</div>
              <div style={{ fontSize: 12, color: '#a1a1aa' }}>Submit your 2026 accommodation application to get a room assigned</div>
            </div>
            <span style={{ fontSize: 20, color: '#3b82f6' }}>→</span>
          </div>
        </Link>
      ) : (
        <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 12, background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: '#71717a', marginBottom: 4 }}>MY APPLICATION · {application.academic_year}</div>
            <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: `${statusColor[application.status]}22`, color: statusColor[application.status], border: `1px solid ${statusColor[application.status]}44` }}>
              {application.status.replace('_',' ').replace(/\b\w/g,(c:string)=>c.toUpperCase())}
            </span>
          </div>
          {application.status === 'rejected' && (
            <Link href="/dashboard/student/apply">
              <button style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Re-apply →</button>
            </Link>
          )}
        </div>
      )}

      {/* CoC banner */}
      {!ack && (
        <Link href="/dashboard/student/onboarding/step-4">
          <div style={{ marginBottom: 20, padding: '12px 18px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>📜 Sign the Code of Conduct to activate your account</div>
            <span style={{ color: '#f59e0b' }}>→</span>
          </div>
        </Link>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>My Room</div>
          {lease ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Block {(lease.rooms as any)?.units?.blocks?.code} · {(lease.rooms as any)?.room_number}</div>
              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>{lease.lease_status}</span>
              {lease.assigned_key_number && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 10, fontFamily: 'monospace' }}>🔑 {lease.assigned_key_number}</div>}
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#52525b', lineHeight: 1.6 }}>No room assigned yet. Submit an application and management will assign your room once approved.</div>
          )}
        </div>
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

      <div style={{ background: '#18181b', border: `1px solid ${totalFines > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Conduct Record</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: (offences?.length ?? 0) > 0 ? '#f43f5e' : '#10b981' }}>{offences?.length ?? 0}</div><div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>OFFENCES</div></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: totalFines > 0 ? '#f59e0b' : '#10b981' }}>R {totalFines.toFixed(2)}</div><div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>TOTAL FINES</div></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: ack?.is_verified ? '#10b981' : '#f59e0b' }}>{ack?.is_verified ? '✓' : '⏳'}</div><div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>COC STATUS</div></div>
        </div>
      </div>
    </div>
  )
}
