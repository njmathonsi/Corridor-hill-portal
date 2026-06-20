// ════════════════════════════════════════════════════════
// app/dashboard/student/my-room/page.tsx
// ════════════════════════════════════════════════════════
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MyRoomPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: lease } = await supabase
    .from('leases')
    .select(`
      id, lease_status, academic_year,
      lease_start_date, lease_end_date,
      check_in_date, assigned_key_number,
      key_issued_at, notes,
      rooms (
        id, room_number, room_type, capacity, monthly_rate,
        units ( unit_code, floor, blocks ( code, description ) )
      )
    `)
    .eq('student_id', session.user.id)
    .eq('is_active', true)
    .limit(1)
    .single()

  return (
    <div className="animate-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>My Room</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>Current accommodation details and lease information</p>
      </div>

      {!lease ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-disabled)', fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
          <div style={{ fontWeight: 600 }}>No room assigned yet</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Management will assign your room once your application is approved.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 700 }}>
          {/* Room card */}
          <div style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Your Room</div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>
                  Block {(lease.rooms as any)?.units?.blocks?.code} · {(lease.rooms as any)?.units?.unit_code} · {(lease.rooms as any)?.room_number}
                </div>
              </div>
              <span style={{
                padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                background: lease.lease_status === 'Checked-In' ? 'var(--emerald-dim)' : 'var(--amber-dim)',
                color: lease.lease_status === 'Checked-In' ? 'var(--emerald)' : 'var(--amber)',
                border: `1px solid ${lease.lease_status === 'Checked-In' ? 'var(--emerald-ring)' : 'var(--amber-ring)'}`,
              }}>
                {lease.lease_status}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {[
                ['Block Description',  (lease.rooms as any)?.units?.blocks?.description],
                ['Room Type',          (lease.rooms as any)?.room_type ?? 'Standard'],
                ['Floor',              (lease.rooms as any)?.units?.floor],
                ['Monthly Rate',       lease.rooms ? `R ${Number((lease.rooms as any)?.monthly_rate ?? 0).toFixed(2)}/month` : '—'],
                ['Academic Year',      lease.academic_year],
                ['Lease Start',        lease.lease_start_date ? new Date(lease.lease_start_date).toLocaleDateString('en-ZA') : '—'],
                ['Lease End',          lease.lease_end_date   ? new Date(lease.lease_end_date).toLocaleDateString('en-ZA')   : '—'],
                ['Check-In Date',      lease.check_in_date    ? new Date(lease.check_in_date).toLocaleDateString('en-ZA')    : '—'],
              ].filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => (
                <div key={k as string} style={{ padding: '9px 0', borderBottom: '1px solid var(--border-dim)', fontSize: 12, paddingRight: 20 }}>
                  <div style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>{k}</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{String(v)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Key card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Key Card</div>
            {lease.assigned_key_number ? (
              <>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em', color: 'var(--amber)' }}>
                  {lease.assigned_key_number}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                  🔑 Issued {lease.key_issued_at ? new Date(lease.key_issued_at).toLocaleDateString('en-ZA') : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                  Keep your key safe. Report any lost keys to reception immediately.
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-disabled)', fontSize: 12 }}>Key not yet issued. See reception desk.</div>
            )}
          </div>

          {/* Notes card */}
          {lease.notes && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-lg)', padding: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Admin Notes</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{lease.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
