import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MyRoomPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: lease } = await supabase
    .from('leases')
    .select('lease_status, academic_year, lease_start_date, lease_end_date, check_in_date, assigned_key_number, key_issued_at, notes, rooms(room_number, room_type, capacity, monthly_rate, units(unit_code, floor, blocks(code, description)))')
    .eq('student_id', session.user.id).eq('is_active', true).limit(1).single()

  if (!lease) return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>My Room</h1>
      <div style={{ marginTop: 60, textAlign: 'center', color: '#52525b' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>No room assigned yet</div>
        <div style={{ fontSize: 12, marginTop: 6 }}>Management will assign your room once your application is approved.</div>
      </div>
    </div>
  )

  const r = lease.rooms as any
  const details = [
    ['Location', `Block ${r?.units?.blocks?.code} · Unit ${r?.units?.unit_code} · ${r?.room_number}`],
    ['Block', r?.units?.blocks?.description],
    ['Room Type', r?.room_type ?? 'Standard'],
    ['Floor', r?.units?.floor],
    ['Monthly Rate', `R ${Number(r?.monthly_rate ?? 0).toFixed(2)}/month`],
    ['Academic Year', lease.academic_year],
    ['Status', lease.lease_status],
    ['Check-In', lease.check_in_date ? new Date(lease.check_in_date).toLocaleDateString('en-ZA') : '—'],
    ['Lease Start', lease.lease_start_date ? new Date(lease.lease_start_date).toLocaleDateString('en-ZA') : '—'],
    ['Lease End', lease.lease_end_date ? new Date(lease.lease_end_date).toLocaleDateString('en-ZA') : '—'],
  ]

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>My Room</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Current accommodation details and lease information</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 700 }}>
        <div style={{ gridColumn: '1/-1', background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Your Room</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Block {r?.units?.blocks?.code} · {r?.units?.unit_code} · {r?.room_number}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {details.filter(([,v]) => v).map(([k, v]) => (
              <div key={k as string} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingRight: 20 }}>
                <div style={{ fontSize: 10, color: '#71717a', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{String(v)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Key Card</div>
          {lease.assigned_key_number ? (
            <>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', color: '#f59e0b', letterSpacing: '0.04em' }}>{lease.assigned_key_number}</div>
              <div style={{ fontSize: 11, color: '#71717a', marginTop: 6 }}>Issued {lease.key_issued_at ? new Date(lease.key_issued_at).toLocaleDateString('en-ZA') : '—'}</div>
              <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 8, lineHeight: 1.5 }}>Keep your key safe. Report lost keys to reception immediately.</div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#52525b' }}>Key not yet issued. See reception desk.</div>
          )}
        </div>
      </div>
    </div>
  )
}
