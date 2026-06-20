// app/dashboard/student/home/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 0

export default async function StudentHomePage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const [
    { data: profile },
    { data: lease },
    { data: bio },
    { data: offences },
    { data: application },
    { data: ackRecord },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', session.user.id).single(),
    supabase
      .from('leases')
      .select(`
        id, lease_status, lease_start_date, lease_end_date,
        check_in_date, assigned_key_number,
        rooms (
          room_number,
          units ( unit_code, blocks ( code ) )
        )
      `)
      .eq('student_id', session.user.id)
      .eq('is_active', true)
      .limit(1)
      .single(),
    supabase
      .from('biometric_registrations')
      .select('biometric_registered, sync_status, registered_at')
      .eq('student_id', session.user.id)
      .limit(1)
      .single(),
    supabase
      .from('offences_log')
      .select('id, incident_date, fine_amount_applied, three_concurrent_flag, offence_definitions(offence_name)')
      .eq('student_id', session.user.id)
      .order('incident_date', { ascending: false })
      .limit(3),
    supabase
      .from('applications')
      .select('id, status, academic_year, submitted_at, rejection_reason')
      .eq('student_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('conduct_acknowledgements')
      .select('id, is_verified, acknowledged_at')
      .eq('student_id', session.user.id)
      .limit(1)
      .single(),
  ])

  // Check onboarding steps
  const onboardingSteps = [
    { step: 1, label: 'Personal Profile',     done: !!(profile?.full_name && profile?.phone), href: '/dashboard/student/onboarding/step-1-profile' },
    { step: 2, label: 'Application Form',     done: !!application, href: '/dashboard/student/onboarding/step-2-application' },
    { step: 3, label: 'Upload Documents',     done: false /* check separately */, href: '/dashboard/student/onboarding/step-3-documents' },
    { step: 4, label: 'Code of Conduct',      done: !!ackRecord, href: '/dashboard/student/onboarding/step-4-conduct' },
  ]

  const onboardingComplete = profile?.onboarding_complete

  return (
    <div className="animate-page">
      {/* Welcome header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Student'} 👋
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
          Corridor Hill Residence · {profile?.student_number ?? '—'}
        </p>
      </div>

      {/* Onboarding banner (if incomplete) */}
      {!onboardingComplete && (
        <div style={{
          marginBottom: 20, padding: '14px 18px', borderRadius: 'var(--r-lg)',
          background: 'var(--blue-dim)', border: '1px solid var(--blue-ring)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', marginBottom: 10 }}>
            Complete your onboarding to activate your room
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {onboardingSteps.map(s => (
              <Link key={s.step} href={s.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 'var(--r-md)',
                  background: s.done ? 'var(--emerald-dim)' : 'var(--bg-raised)',
                  border: `1px solid ${s.done ? 'var(--emerald-ring)' : 'var(--border-mid)'}`,
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: s.done ? 'var(--emerald)' : 'var(--bg-active)',
                    border: `1.5px solid ${s.done ? 'var(--emerald)' : 'var(--border-mid)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    color: s.done ? '#fff' : 'var(--text-disabled)',
                  }}>
                    {s.done ? '✓' : s.step}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: s.done ? 'var(--emerald)' : 'var(--text-primary)' }}>
                    {s.label}
                  </span>
                  {!s.done && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--blue)' }}>→ Start</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>

        {/* Room / Lease card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 10 }}>
            My Room
          </div>
          {lease ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 4 }}>
                Block {lease.rooms?.units?.blocks?.code} · {lease.rooms?.units?.unit_code} · {lease.rooms?.room_number}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{
                  padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                  background: lease.lease_status === 'Checked-In' ? 'var(--emerald-dim)' : 'var(--amber-dim)',
                  color: lease.lease_status === 'Checked-In' ? 'var(--emerald)' : 'var(--amber)',
                  border: `1px solid ${lease.lease_status === 'Checked-In' ? 'var(--emerald-ring)' : 'var(--amber-ring)'}`,
                }}>
                  {lease.lease_status}
                </span>
              </div>
              {[
                ['Key Number', lease.assigned_key_number],
                ['Check-In', lease.check_in_date ? new Date(lease.check_in_date).toLocaleDateString('en-ZA') : null],
                ['Lease End', lease.lease_end_date ? new Date(lease.lease_end_date).toLocaleDateString('en-ZA') : null],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderTop: '1px solid var(--border-dim)' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{k}</span>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>{String(v)}</span>
                </div>
              ))}
            </>
          ) : (
            <div style={{ color: 'var(--text-disabled)', fontSize: 12 }}>
              No room assigned yet.{' '}
              {application?.status === 'submitted' || application?.status === 'under_review'
                ? 'Your application is under review.'
                : 'Submit an application to get started.'}
            </div>
          )}
        </div>

        {/* Biometrics card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 10 }}>
            Biometrics
          </div>
          {bio?.biometric_registered ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--emerald)', marginBottom: 6 }}>✓ Registered</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                Sync status: <span style={{ color: bio.sync_status === 'synced' ? 'var(--emerald)' : 'var(--amber)' }}>{bio.sync_status}</span>
              </div>
              {bio.registered_at && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3, fontFamily: 'JetBrains Mono, monospace' }}>
                  {new Date(bio.registered_at).toLocaleDateString('en-ZA')}
                </div>
              )}
            </>
          ) : (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--amber)', marginBottom: 6 }}>⚠ Not Registered</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Contact the reception desk to complete biometric registration within 5 days of check-in.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Application status */}
      {application && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 10 }}>
            My Application — {application.academic_year}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              background: application.status === 'approved' ? 'var(--emerald-dim)' : application.status === 'rejected' ? 'var(--rose-dim)' : 'var(--amber-dim)',
              color: application.status === 'approved' ? 'var(--emerald)' : application.status === 'rejected' ? 'var(--rose)' : 'var(--amber)',
              border: `1px solid ${application.status === 'approved' ? 'var(--emerald-ring)' : application.status === 'rejected' ? 'var(--rose-ring)' : 'var(--amber-ring)'}`,
            }}>
              {application.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
            {application.rejection_reason && (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Reason: {application.rejection_reason}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recent offences */}
      {(offences?.length ?? 0) > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--rose-ring)', borderRadius: 'var(--r-lg)', padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--rose)', marginBottom: 10 }}>
            Conduct Notices
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(offences ?? []).map(o => (
              <div key={o.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: 'var(--r-md)',
                background: 'var(--bg-raised)', border: '1px solid var(--border-dim)', fontSize: 12,
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{(o as any).offence_definitions?.offence_name ?? '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {new Date(o.incident_date).toLocaleDateString('en-ZA')}
                  </div>
                </div>
                {Number(o.fine_amount_applied) > 0 && (
                  <span style={{ color: 'var(--amber)', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                    R {Number(o.fine_amount_applied).toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <Link href="/dashboard/student/my-conduct" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 12, color: 'var(--blue)', marginTop: 10, textAlign: 'center', cursor: 'pointer' }}>
              View full conduct record →
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
