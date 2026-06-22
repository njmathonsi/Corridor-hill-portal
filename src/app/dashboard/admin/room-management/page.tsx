import { createClient } from '@/lib/supabase/server'

export default async function RoomManagementPage() {
  const supabase = createClient()
  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, room_number, room_type, capacity, monthly_rate, is_available, units(unit_code, blocks(code))')
    .order('room_number')

  const { data: leases } = await supabase
    .from('leases')
    .select('room_id, lease_status, assigned_key_number, profiles!leases_student_id_fkey(full_name, student_number)')
    .eq('is_active', true)

  const leaseByRoom: Record<number, any> = {}
  for (const l of leases ?? []) if (l.room_id) leaseByRoom[l.room_id] = l

  const byBlock: Record<string, any[]> = {}
  for (const room of rooms ?? []) {
    const code = (room.units as any)?.blocks?.code ?? '?'
    if (!byBlock[code]) byBlock[code] = []
    byBlock[code].push(room)
  }

  const total = rooms?.length ?? 0
  const occupied = (rooms ?? []).filter(r => !r.is_available).length

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Room Management</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Occupancy grid · Assign rooms · Key management</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Rooms', value: total, color: '#fafafa' },
          { label: 'Occupied', value: occupied, color: '#f43f5e' },
          { label: 'Available', value: total - occupied, color: '#10b981' },
          { label: 'Occupancy', value: `${total > 0 ? Math.round((occupied/total)*100) : 0}%`, color: '#f59e0b' },
        ].map(t => (
          <div key={t.label} style={{ flex: 1, background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.color }}>{t.value}</div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      {Object.entries(byBlock).sort().map(([blockCode, blockRooms]) => (
        <div key={blockCode} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', marginBottom: 12 }}>Block {blockCode}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {blockRooms.map((room: any) => {
              const lease = leaseByRoom[room.id]
              const occupied = !room.is_available && lease
              return (
                <div key={room.id} style={{ width: 148, padding: '10px 12px', borderRadius: 10, border: `1px solid ${occupied ? 'rgba(255,255,255,0.08)' : 'rgba(16,185,129,0.35)'}`, background: occupied ? '#18181b' : 'rgba(16,185,129,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#fafafa' }}>{room.room_number}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: occupied ? '#27272a' : '#10b981', color: occupied ? '#a1a1aa' : '#fff' }}>
                      {occupied ? 'OCC' : 'FREE'}
                    </span>
                  </div>
                  {occupied && lease?.profiles ? (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lease.profiles.full_name}</div>
                      <div style={{ fontSize: 9, color: '#71717a', fontFamily: 'monospace', marginTop: 1 }}>{lease.profiles.student_number}</div>
                      {lease.assigned_key_number && <div style={{ fontSize: 9, color: '#f59e0b', marginTop: 3 }}>🔑 {lease.assigned_key_number}</div>}
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: '#10b981' }}>R{room.monthly_rate ?? '—'}/mo</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {Object.keys(byBlock).length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#52525b', fontSize: 13 }}>No rooms seeded yet. Run the seed SQL in Supabase first.</div>
      )}
    </div>
  )
}
