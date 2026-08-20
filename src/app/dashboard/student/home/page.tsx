import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Inbox, ArrowRight, ScrollText, KeyRound, Check, AlertTriangle, Clock } from 'lucide-react'
import AnimatedNumber from '@/components/ui/AnimatedNumber'

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
  const statusColor: Record<string,string> = { submitted:'#3b82f6', under_review:'var(--brand)', approved:'#10b981', rejected:'#f43f5e', draft:'#71717a' }

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Student'} 👋</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>TENTSARI Residence · {profile?.student_number ?? '—'}</p>

      {/* Application CTA or status */}
      {!application ? (
        <Link href="/dashboard/student/apply">
          <div className="glass-card group" style={{ marginBottom: 20, padding: '16px 20px', background: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(139,92,246,0.15))', border: '1px solid rgba(59,130,246,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#3b82f6', marginBottom: 3 }}>
                <Inbox className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> Apply for Accommodation
              </div>
              <div style={{ fontSize: 12, color: '#a1a1aa' }}>Submit your 2026 accommodation application to get a room assigned</div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" style={{ color: '#3b82f6' }} />
          </div>
        </Link>
      ) : (
        <div className="glass-card" style={{ marginBottom: 20, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: '#71717a', marginBottom: 4 }}>MY APPLICATION · {application.academic_year}</div>
            <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: `${statusColor[application.status]}22`, color: statusColor[application.status], border: `1px solid ${statusColor[application.status]}44` }}>
              {application.status.replace('_',' ').replace(/\b\w/g,(c:string)=>c.toUpperCase())}
            </span>
          </div>
          {application.status === 'rejected' && (
            <Link href="/dashboard/student/apply">
              <button className="glass-btn group" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontSize: 12, fontWeight: 600 }}>
                Re-apply <ArrowRight className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              </button>
            </Link>
          )}
        </div>
      )}

      {/* CoC banner */}
      {!ack && (
        <Link href="/dashboard/student/onboarding/step-4">
          <div className="glass-card group" style={{ marginBottom: 20, padding: '12px 18px', background: 'rgb(var(--brand-rgb) / 0.08)', border: '1px solid rgb(var(--brand-rgb) / 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>
              <ScrollText className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> Sign the Code of Conduct to activate your account
            </div>
            <ArrowRight className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" style={{ color: 'var(--brand)' }} />
          </div>
        </Link>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>My Room</div>
          {lease ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Block {(lease.rooms as any)?.units?.blocks?.code} · {(lease.rooms as any)?.room_number}</div>
              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>{lease.lease_status}</span>
              {lease.assigned_key_number && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--brand)', marginTop: 10, fontFamily: 'monospace' }}>
                  <KeyRound className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> {lease.assigned_key_number}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#52525b', lineHeight: 1.6 }}>No room assigned yet. Submit an application and management will assign your room once approved.</div>
          )}
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Biometrics</div>
          {bio?.biometric_registered ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 16, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
                <Check className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> Registered
              </div>
              <div style={{ fontSize: 11, color: '#71717a' }}>Sync: <span style={{ color: bio.sync_status === 'synced' ? '#10b981' : 'var(--brand)' }}>{bio.sync_status}</span></div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 600, color: 'var(--brand)', marginBottom: 6 }}>
                <AlertTriangle className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> Not Registered
              </div>
              <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>Visit reception to register within 5 days of check-in.</div>
            </>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ border: `1px solid ${totalFines > 0 ? 'rgb(var(--brand-rgb) / 0.3)' : 'rgba(255,255,255,0.1)'}`, padding: 20 }}>
        <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Conduct Record</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: (offences?.length ?? 0) > 0 ? '#f43f5e' : '#10b981' }}><AnimatedNumber value={offences?.length ?? 0} /></div><div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>OFFENCES</div></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: totalFines > 0 ? 'var(--brand)' : '#10b981' }}><AnimatedNumber value={totalFines} prefix="R " decimals={2} /></div><div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>TOTAL FINES</div></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: ack?.is_verified ? '#10b981' : 'var(--brand)' }}>{ack?.is_verified ? <Check className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" /> : <Clock className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />}</div><div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>COC STATUS</div></div>
        </div>
      </div>
    </div>
  )
}
