import { createClient } from '@/lib/supabase/server'
import AssignRoomModal from './AssignRoomModal'
import CheckOutButton from './CheckOutButton'

export default async function RoomManagementPage() {
  const supabase = createClient()
  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, room_number, room_type, capacity, monthly_rate, is_available, units(unit_code, blocks(code))')
    .order('room_number')

  const { data: leases } = await supabase
    .from('leases')
    .select('id, room_id, lease_status, assigned_key_number, student_id, profiles!leases_student_id_fkey(full_name, student_number)')
    .eq('is_active', true)

  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, student_number, course')
    .eq('role', 'student')
    .order('full_name')

  const leaseByRoom: Record<number, any> = {}
  for (const l of leases ?? []) if (l.room_id) leaseByRoom[l.room_id] = l

  const byBlock: Record<string, any[]> = {}
  for (const room of rooms ?? []) {
    const code = (room.units as any)?.blocks?.code ?? '?'
    if (!byBlock[code]) byBlock[code] = []
    byBlock[code].push(room)
  }

  const total    = rooms?.length ?? 0
  const occupied = (rooms ?? []).filter(r => !r.is_available).length

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Room Management</h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Occupancy grid · Click a free room to assign · Click occupied to check out</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Rooms', value: total,          color: '#fafafa' },
          { label: 'Occupied',    value: occupied,        color: '#f43f5e' },
          { label: 'Available',   value: total - occupied,color: '#10b981' },
          { label: 'Occupancy',   value: `${total > 0 ? Math.round((occupied/total)*100) : 0}%`, color: '#f59e0b' },
        ].map(t => (
          <div key={t.label} style={{ flex: 1, background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.color }}>{t.value}</div>
            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      {Object.entries(byBlock).sort().map(([blockCode, blockRooms]) => (
        <div key={blockCode} style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            Block {blockCode}
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontWeight: 400, color: '#52525b', fontSize: 10 }}>
              {blockRooms.filter((r: any) => !r.is_available).length}/{blockRooms.length} occupied
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {blockRooms.map((room: any) => {
              const lease = leaseByRoom[room.id]
              const isOccupied = !room.is_available && lease
              return (
                <div key={room.id} style={{ width: 160, padding: '12px 14px', borderRadius: 10, border: `1px solid ${isOccupied ? 'rgba(255,255,255,0.08)' : 'rgba(16,185,129,0.3)'}`, background: isOccupied ? '#18181b' : 'rgba(16,185,129,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#fafafa' }}>{room.room_number}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: isOccupied ? '#27272a' : '#10b981', color: isOccupied ? '#a1a1aa' : '#fff' }}>
                      {isOccupied ? 'OCC' : 'FREE'}
                    </span>
                  </div>
                  {isOccupied ? (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{lease.profiles?.full_name}</div>
                      <div style={{ fontSize: 9, color: '#71717a', fontFamily: 'monospace', marginBottom: 6 }}>{lease.profiles?.student_number}</div>
                      {lease.assigned_key_number && <div style={{ fontSize: 9, color: '#f59e0b', marginBottom: 8 }}>🔑 {lease.assigned_key_number}</div>}
                      <CheckOutButton leaseId={lease.id} studentName={lease.profiles?.full_name ?? ''} />
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 10, color: '#10b981', marginBottom: 8 }}>R{room.monthly_rate ?? '—'}/mo</div>
                      <AssignRoomModal roomId={room.id} roomNumber={room.room_number} blockCode={blockCode} students={students ?? []} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {Object.keys(byBlock).length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#52525b' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏠</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No rooms seeded yet</div>
          <div style={{ fontSize: 12 }}>Run the seed SQL in Supabase to add blocks, units, and rooms.</div>
        </div>
      )}
    </div>
  )
}
