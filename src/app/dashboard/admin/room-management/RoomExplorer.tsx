'use client'
import { useState, useMemo, useTransition, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

interface Block { id: number; code: string; description: string | null; gender: string | null }
interface Unit  { id: number; unit_code: string; floor: number; block_id: number }
interface Room  { id: number; room_number: string; room_type: string | null; capacity: number; monthly_rate: number | null; is_available: boolean; unit_id: number }
interface Lease { id: string; room_id: number; lease_status: string; assigned_key_number: string | null; student_id: string; profiles: { full_name: string; student_number: string } | null }
interface Student { id: string; full_name: string; student_number: string; course: string | null }

const GENDER_COLOR: Record<string, string> = { female: '#ec4899', male: '#3b82f6', mixed: '#8b5cf6' }

export default function RoomExplorer({ blocks, units, rooms, leases, students }: {
  blocks: Block[]; units: Unit[]; rooms: Room[]; leases: Lease[]; students: Student[]
}) {
  const searchParams = useSearchParams()
  const preselectStudentId = searchParams.get('assignStudent')

  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [expandedUnitId, setExpandedUnitId] = useState<number | null>(null)
  const [assigningRoom, setAssigningRoom] = useState<Room | null>(null)
  const [viewingRoom, setViewingRoom] = useState<Room | null>(null)

  // Banner for guided workflow (came from Applications approve)
  const preselectStudent = students.find(s => s.id === preselectStudentId)

  // Group leases by room (multiple students per room now)
  const leasesByRoom = useMemo(() => {
    const map: Record<number, Lease[]> = {}
    for (const l of leases) {
      if (!map[l.room_id]) map[l.room_id] = []
      map[l.room_id].push(l)
    }
    return map
  }, [leases])

  const unitById = useMemo(() => {
    const map: Record<number, Unit> = {}
    for (const u of units) map[u.id] = u
    return map
  }, [units])

  const blockStats = useMemo(() => blocks.map(b => {
    const blockUnitIds = units.filter(u => u.block_id === b.id).map(u => u.id)
    const blockRooms = rooms.filter(r => blockUnitIds.includes(r.unit_id))
    const occupiedBeds = blockRooms.reduce((sum, r) => sum + (leasesByRoom[r.id]?.length ?? 0), 0)
    const totalBeds = blockRooms.reduce((sum, r) => sum + r.capacity, 0)
    const pct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
    return { block: b, total: totalBeds, occupied: occupiedBeds, pct, roomCount: blockRooms.length }
  }), [blocks, units, rooms, leasesByRoom])

  const floorsInBlock = useMemo(() => {
    if (!selectedBlock) return []
    const floorSet = new Set(units.filter(u => u.block_id === selectedBlock.id).map(u => u.floor))
    return [...floorSet].sort((a, b) => a - b)
  }, [selectedBlock, units])

  const unitsOnFloor = useMemo(() => {
    if (!selectedBlock || selectedFloor === null) return []
    return units.filter(u => u.block_id === selectedBlock.id && u.floor === selectedFloor).sort((a, b) => a.unit_code.localeCompare(b.unit_code))
  }, [selectedBlock, selectedFloor, units])

  function unitStats(unitId: number) {
    const unitRooms = rooms.filter(r => r.unit_id === unitId)
    const occupiedBeds = unitRooms.reduce((sum, r) => sum + (leasesByRoom[r.id]?.length ?? 0), 0)
    const totalBeds = unitRooms.reduce((sum, r) => sum + r.capacity, 0)
    return { total: totalBeds, occupied: occupiedBeds, roomCount: unitRooms.length }
  }

  function floorStats(floor: number) {
    if (!selectedBlock) return { total: 0, occupied: 0 }
    const floorUnitIds = units.filter(u => u.block_id === selectedBlock.id && u.floor === floor).map(u => u.id)
    const floorRooms = rooms.filter(r => floorUnitIds.includes(r.unit_id))
    const occupiedBeds = floorRooms.reduce((sum, r) => sum + (leasesByRoom[r.id]?.length ?? 0), 0)
    const totalBeds = floorRooms.reduce((sum, r) => sum + r.capacity, 0)
    return { total: totalBeds, occupied: occupiedBeds }
  }

  function toggleUnit(unitId: number) { setExpandedUnitId(prev => prev === unitId ? null : unitId) }
  function goToBlock(b: Block) { setSelectedBlock(b); setSelectedFloor(null); setExpandedUnitId(null) }
  function goToFloor(f: number) { setSelectedFloor(f); setExpandedUnitId(null) }
  function backToBlocks() { setSelectedBlock(null); setSelectedFloor(null); setExpandedUnitId(null) }
  function backToFloors() { setSelectedFloor(null); setExpandedUnitId(null) }

  return (
    <div style={{ padding: 28 }}>
      {/* Guided workflow banner */}
      {preselectStudent && (
        <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 12, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>📥</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>Assigning room for {preselectStudent.full_name}</div>
            <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 2 }}>Navigate to a block → floor → unit, then click a room with an open bed to assign.</div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12, color: '#71717a' }}>
        <span onClick={backToBlocks} style={{ cursor: selectedBlock ? 'pointer' : 'default', color: !selectedBlock ? '#fafafa' : '#71717a', fontWeight: !selectedBlock ? 700 : 400 }}>All Blocks</span>
        {selectedBlock && (<><span>›</span><span onClick={backToFloors} style={{ cursor: selectedFloor !== null ? 'pointer' : 'default', color: selectedFloor === null ? '#fafafa' : '#71717a', fontWeight: selectedFloor === null ? 700 : 400 }}>Block {selectedBlock.code}</span></>)}
        {selectedFloor !== null && (<><span>›</span><span style={{ color: '#fafafa', fontWeight: 700 }}>Floor {selectedFloor}</span></>)}
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        {!selectedBlock && 'Room Management'}
        {selectedBlock && selectedFloor === null && `Block ${selectedBlock.code} — Select Floor`}
        {selectedBlock && selectedFloor !== null && `Block ${selectedBlock.code} · Floor ${selectedFloor}`}
      </h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>
        {!selectedBlock && 'Click a block to see its floors'}
        {selectedBlock && selectedFloor === null && 'Choose a floor to view its units'}
        {selectedBlock && selectedFloor !== null && 'Click a unit to reveal its 3 rooms — each room holds 2 students'}
      </p>

      {/* BLOCKS */}
      {!selectedBlock && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 700 }}>
          {blockStats.map(({ block, total, occupied, pct, roomCount }) => {
            const color = pct >= 90 ? '#f43f5e' : pct >= 60 ? '#f59e0b' : '#10b981'
            const genderColor = GENDER_COLOR[block.gender ?? ''] ?? '#71717a'
            return (
              <div key={block.id} onClick={() => goToBlock(block)} style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 22px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${genderColor}22`, border: `1px solid ${genderColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: genderColor }}>{block.code}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa' }}>Block {block.code}</div>
                      <div style={{ fontSize: 11, color: '#71717a', textTransform: 'capitalize' }}>{block.gender ?? '—'} Residence · {roomCount} rooms · {total} beds</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{pct}%</div>
                    <div style={{ fontSize: 10, color: '#71717a' }}>{occupied}/{total} beds filled</div>
                  </div>
                </div>
                <div style={{ height: 6, background: '#27272a', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FLOORS */}
      {selectedBlock && selectedFloor === null && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, maxWidth: 700 }}>
          {floorsInBlock.map(floor => {
            const { total, occupied } = floorStats(floor)
            const pct = total > 0 ? Math.round((occupied / total) * 100) : 0
            const color = pct >= 90 ? '#f43f5e' : pct >= 60 ? '#f59e0b' : '#10b981'
            const unitCount = units.filter(u => u.block_id === selectedBlock.id && u.floor === floor).length
            return (
              <div key={floor} onClick={() => goToFloor(floor)} style={{ width: 170, background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px', cursor: 'pointer' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Floor {floor}</div>
                <div style={{ fontSize: 11, color: '#71717a', marginBottom: 10 }}>{unitCount} units · {total} beds</div>
                <div style={{ fontSize: 18, fontWeight: 800, color }}>{pct}%</div>
                <div style={{ height: 4, background: '#27272a', borderRadius: 99, overflow: 'hidden', marginTop: 6 }}><div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} /></div>
              </div>
            )
          })}
        </div>
      )}

      {/* UNITS (accordion) */}
      {selectedBlock && selectedFloor !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 700 }}>
          {unitsOnFloor.map(unit => {
            const { total, occupied, roomCount } = unitStats(unit.id)
            const isExpanded = expandedUnitId === unit.id
            const unitRooms = rooms.filter(r => r.unit_id === unit.id).sort((a, b) => a.room_number.localeCompare(b.room_number))
            const pct = total > 0 ? Math.round((occupied / total) * 100) : 0
            const color = pct >= 90 ? '#f43f5e' : pct >= 60 ? '#f59e0b' : '#10b981'

            return (
              <div key={unit.id} style={{ background: '#18181b', border: `1px solid ${isExpanded ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, overflow: 'hidden' }}>
                <div onClick={() => toggleUnit(unit.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#71717a', fontSize: 14 }}>▶</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa' }}>Unit {selectedBlock.code}{unit.unit_code}</div>
                      <div style={{ fontSize: 11, color: '#71717a' }}>{roomCount} rooms · {total} beds</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{occupied}/{total}</span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 18px 16px 18px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                    {unitRooms.map(room => {
                      const roomLeases = leasesByRoom[room.id] ?? []
                      const bedsUsed = roomLeases.length
                      const bedsTotal = room.capacity
                      const isFull = bedsUsed >= bedsTotal
                      const statusColor = isFull ? '#f43f5e' : bedsUsed > 0 ? '#f59e0b' : '#10b981'

                      return (
                        <div
                          key={room.id}
                          onClick={() => isFull ? setViewingRoom(room) : setAssigningRoom(room)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', background: `${statusColor}0f`, border: `1px solid ${statusColor}44` }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{selectedBlock.code}{unit.unit_code}-{room.room_number.replace('Room ', '')}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {roomLeases.length > 0 && (
                              <div style={{ textAlign: 'right' }}>
                                {roomLeases.map(l => (
                                  <div key={l.id} style={{ fontSize: 10, color: '#fafafa', fontWeight: 600 }}>{l.profiles?.full_name}</div>
                                ))}
                              </div>
                            )}
                            <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>{bedsUsed}/{bedsTotal} beds</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {assigningRoom && (
        <AssignModal
          room={assigningRoom}
          blockCode={selectedBlock?.code ?? ''}
          unitCode={unitById[assigningRoom.unit_id]?.unit_code ?? ''}
          students={students}
          existingLeases={leasesByRoom[assigningRoom.id] ?? []}
          preselectStudentId={preselectStudentId}
          onClose={() => setAssigningRoom(null)}
        />
      )}
      {viewingRoom && (
        <ViewModal
          room={viewingRoom}
          leases={leasesByRoom[viewingRoom.id] ?? []}
          blockCode={selectedBlock?.code ?? ''}
          unitCode={unitById[viewingRoom.unit_id]?.unit_code ?? ''}
          onClose={() => setViewingRoom(null)}
        />
      )}
    </div>
  )
}

// ══════════════════════ ASSIGN MODAL (supports 2 beds) ══════════════════════
function AssignModal({ room, blockCode, unitCode, students, existingLeases, preselectStudentId, onClose }: {
  room: Room; blockCode: string; unitCode: string; students: Student[]; existingLeases: Lease[]; preselectStudentId: string | null; onClose: () => void
}) {
  const [studentId, setStudentId] = useState(preselectStudentId ?? '')
  const [keyNumber, setKeyNumber] = useState('')
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

  const bedsLeft = room.capacity - existingLeases.length

  async function handleAssign() {
    if (!studentId) return
    startTransition(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      await supabase.from('leases').update({ is_active: false }).eq('student_id', studentId).eq('is_active', true)
      await supabase.from('leases').insert({
        student_id: studentId, room_id: room.id, lease_status: 'Checked-In',
        academic_year: new Date().getFullYear().toString(),
        lease_start_date: new Date().toISOString().split('T')[0],
        check_in_date: new Date().toISOString(),
        assigned_key_number: keyNumber || `${blockCode}${unitCode}-${room.room_number.slice(-1)}-${existingLeases.length + 1}`,
        key_issued_at: new Date().toISOString(), assigned_by: session?.user.id, is_active: true,
      })
      // Only mark room fully unavailable when both beds are taken
      if (existingLeases.length + 1 >= room.capacity) {
        await supabase.from('rooms').update({ is_available: false }).eq('id', room.id)
      }

      // If this came from the guided workflow (approve → assign room), continue to biometrics
      if (preselectStudentId === studentId) {
        onClose()
        router.push(`/dashboard/admin/biometrics-hub?registerStudent=${studentId}`)
        return
      }

      onClose(); router.refresh()
    })
  }

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '9px 12px', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Assign Room</div>
            <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{blockCode}{unitCode}-{room.room_number.replace('Room ', '')} · {bedsLeft} bed{bedsLeft !== 1 ? 's' : ''} available</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {existingLeases.length > 0 && (
          <div style={{ marginBottom: 14, padding: '10px 12px', background: '#1f1f23', borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: '#71717a', marginBottom: 6 }}>CURRENTLY IN THIS ROOM</div>
            {existingLeases.map(l => (
              <div key={l.id} style={{ fontSize: 12, color: '#fafafa', fontWeight: 600 }}>{l.profiles?.full_name}</div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 10, color: '#71717a', display: 'block', marginBottom: 4 }}>STUDENT</label>
          <select value={studentId} onChange={e => setStudentId(e.target.value)} style={inp}>
            <option value="">Select student…</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name} {s.student_number ? `· ${s.student_number}` : ''}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, color: '#71717a', display: 'block', marginBottom: 4 }}>KEY NUMBER</label>
          <input value={keyNumber} onChange={e => setKeyNumber(e.target.value)} placeholder={`${blockCode}${unitCode}-K${existingLeases.length + 1}`} style={{ ...inp, fontFamily: 'monospace' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleAssign} disabled={!studentId || pending} style={{ flex: 2, padding: '9px', borderRadius: 8, background: studentId ? '#10b981' : '#27272a', color: studentId ? '#fff' : '#52525b', border: 'none', fontSize: 13, fontWeight: 700, cursor: studentId ? 'pointer' : 'not-allowed', opacity: pending ? 0.5 : 1 }}>
            {pending ? 'Assigning…' : '✓ Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════ VIEW MODAL (shows both students) ══════════════════════
function ViewModal({ room, leases, blockCode, unitCode, onClose }: { room: Room; leases: Lease[]; blockCode: string; unitCode: string; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

  async function handleCheckOut(lease: Lease) {
    if (!confirm(`Check out ${lease.profiles?.full_name}?`)) return
    startTransition(async () => {
      await supabase.from('leases').update({ lease_status: 'Checked-Out', check_out_date: new Date().toISOString(), is_active: false }).eq('id', lease.id)
      await supabase.from('rooms').update({ is_available: true }).eq('id', room.id)
      onClose(); router.refresh()
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{blockCode}{unitCode}-{room.room_number.replace('Room ', '')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        {leases.map(lease => (
          <div key={lease.id} style={{ marginBottom: 14, padding: '12px 14px', background: '#1f1f23', borderRadius: 8 }}>
            {[['Occupant', lease.profiles?.full_name], ['Student No.', lease.profiles?.student_number], ['Status', lease.lease_status], ['Key', lease.assigned_key_number]].map(([k, v]) => v && (
              <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                <span style={{ color: '#71717a' }}>{k}</span><span style={{ color: '#fafafa', fontWeight: 600 }}>{String(v)}</span>
              </div>
            ))}
            <button onClick={() => handleCheckOut(lease)} disabled={pending} style={{ width: '100%', marginTop: 8, padding: '7px', borderRadius: 8, background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: pending ? 0.5 : 1 }}>
              {pending ? '…' : `🚪 Check Out ${lease.profiles?.full_name?.split(' ')[0]}`}
            </button>
          </div>
        ))}
        <button onClick={onClose} style={{ width: '100%', padding: '9px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a', fontSize: 12, cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  )
}
