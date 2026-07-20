import { createClient } from '@/lib/supabase/server'
import RoomExplorer from './RoomExplorer'

export default async function RoomManagementPage() {
  const supabase = createClient()

  const { data: blocks } = await supabase
    .from('blocks')
    .select('id, code, description, gender')
    .order('code')

  const { data: units } = await supabase
    .from('units')
    .select('id, unit_code, floor, block_id')
    .order('floor')
    .order('unit_code')

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, room_number, room_type, capacity, monthly_rate, is_available, unit_id')
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

  return (
    <RoomExplorer
      blocks={(blocks ?? []) as any}
      units={(units ?? []) as any}
      rooms={(rooms ?? []) as any}
      leases={(leases ?? []) as any}
      students={(students ?? []) as any}
    />
  )
}
