// app/dashboard/admin/room-management/page.tsx
import { createClient } from '@/lib/supabase/server'
import RoomGrid from '@/components/room-management/RoomGrid'

export const revalidate = 0

export default async function RoomManagementPage() {
  const supabase = createClient()

  const [
    { data: blocks },
    { data: rooms },
    { data: activeLeases },
    { data: approvedStudents },
  ] = await Promise.all([
    supabase.from('blocks').select('id, code, description').order('code'),
    supabase
      .from('rooms')
      .select(`
        id, room_number, room_type, capacity, monthly_rate, is_available, notes,
        units ( id, unit_code, floor, block_id, blocks ( code ) )
      `)
      .order('room_number'),
    supabase
      .from('leases')
      .select(`
        id, lease_status, assigned_key_number, check_in_date,
        student_id,
        room_id,
        profiles!leases_student_id_fkey ( full_name, student_number )
      `)
      .eq('is_active', true)
      .in('lease_status', ['Checked-In', 'Room Transfer Pending']),
    // Students with approved applications but no active lease
    supabase
      .from('profiles')
      .select('id, full_name, student_number, course, faculty')
      .eq('role', 'student')
      .eq('is_active', true),
  ])

  // Map room_id → lease
  const leaseByRoom: Record<number, (typeof activeLeases)[0]> = {}
  for (const l of activeLeases ?? []) {
    if (l.room_id) leaseByRoom[l.room_id] = l
  }

  // Group rooms by block
  const byBlock: Record<string, { blockCode: string; rooms: typeof rooms }> = {}
  for (const room of rooms ?? []) {
    const code = (room.units as any)?.blocks?.code ?? '?'
    if (!byBlock[code]) byBlock[code] = { blockCode: code, rooms: [] }
    byBlock[code].rooms.push(room)
  }

  const occupiedCount = (rooms ?? []).filter(r => !r.is_available).length
  const totalCount    = (rooms ?? []).length
  const availCount    = totalCount - occupiedCount
  const occupancyPct  = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0

  return (
    <div className="animate-page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Room Management</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            Occupancy grid · Assign rooms · Key management
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { val: totalCount,      label: 'Total Rooms',    color: 'var(--text-primary)' },
          { val: occupiedCount,   label: 'Occupied',       color: 'var(--rose)'    },
          { val: availCount,      label: 'Available',      color: 'var(--emerald)' },
          { val: `${occupancyPct}%`, label: 'Occupancy',  color: occupancyPct > 85 ? 'var(--emerald)' : occupancyPct > 60 ? 'var(--amber)' : 'var(--rose)' },
        ].map(t => (
          <div key={t.label} style={{
            flex: 1, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)',
            borderRadius: 'var(--r-md)', padding: '10px 14px',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: t.color }}>{t.val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      <RoomGrid
        byBlock={byBlock}
        leaseByRoom={leaseByRoom}
        students={approvedStudents ?? []}
      />
    </div>
  )
}
