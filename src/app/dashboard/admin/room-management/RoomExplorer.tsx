'use client'
import { useState, useMemo, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Block { id: number; code: string; description: string | null; gender: string | null }
interface Unit  { id: number; unit_code: string; floor: number; block_id: number }
interface Room  { id: number; room_number: string; room_type: string | null; capacity: number; monthly_rate: number | null; is_available: boolean; unit_id: number }
interface Lease { id: string; room_id: number; lease_status: string; assigned_key_number: string | null; student_id: string; profiles: { full_name: string; student_number: string } | null }
interface Student { id: string; full_name: string; student_number: string; course: string | null }

type View = 'blocks' | 'floors' | 'rooms'

const GENDER_COLOR: Record<string, string> = {
  female: '#ec4899',
  male: '#3b82f6',
  mixed: '#8b5cf6',
}

export default function RoomExplorer({ blocks, units, rooms, leases, students }: {
  blocks: Block[]; units: Unit[]; rooms: Room[]; leases: Lease[]; students: Student[]
}) {
  const [view, setView] = useState<View>('blocks')
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [assigningRoom, setAssigningRoom] = useState<Room | null>(null)
  const [viewingRoom, setViewingRoom] = useState<Room | null>(null)

  const leaseByRoom = useMemo(() => {
    const map: Record<number, Lease> = {}
    for (const l of leases) map[l.room_id] = l
    return map
  }, [leases])

  const unitById = useMemo(() => {
    const map: Record<number, Unit> = {}
    for (const u of units) map[u.id] = u
    return map
  }, [units])

  // ── Block-level stats ──
  const blockStats = useMemo(() => {
    return blocks.map(b => {
      const blockUnitIds = units.filter(u => u.block_id === b.id).map(u => u.id)
      const blockRooms = rooms.filter(r => blockUnitIds.includes(r.unit_id))
      const occupied = blockRooms.filter(r => !r.is_available).length
      const total = blockRooms.length
      const pct = total > 0 ? Math.round((occupied / total) * 100) : 0
      return { block: b, total, occupied, pct }
    })
  }, [blocks, units, rooms])

  // ── Floors within selected block ──
  const floorsInBlock = useMemo(() => {
    if (!selectedBlock) return []
    const floorSet = new Set(units.filter(u => u.block_id === selectedBlock.id).map(u => u.floor))
    return [...floorSet].sort((a, b) => a - b)
  }, [selectedBlock, units])

  // ── Rooms on selected floor ──
  const roomsOnFloor = useMemo(() => {
    if (!selectedBlock || selectedFloor === null) return []
    const floorUnitIds = units.filter(u => u.block_id === selectedBlock.id && u.floor === selectedFloor).map(u => u.id)
    return rooms.filter(r => floorUnitIds.includes(r.unit_id)).sort((a, b) => a.room_number.localeCompare(b.room_number))
  }, [selectedBlock, selectedFloor, units, rooms])

  function goToBlock(b: Block) { setSelectedBlock(b); setView('floors') }
  function goToFloor(f: number) { setSelectedFloor(f); setView('rooms') }
  function backToBlocks() { setView('blocks'); setSelectedBlock(null); setSelectedFloor(null) }
  function backToFloors() { setView('floors'); setSelectedFloor(null) }

  return (
    <div style={{ padding: 28 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12, color: '#71717a' }}>
        <span onClick={backToBlocks} style={{ cursor: view !== 'blocks' ? 'pointer' : 'default', color: view === 'blocks' ? '#fafafa' : '#71717a', fontWeight: view === 'blocks' ? 700 : 400 }}>All Blocks</span>
        {selectedBlock && (
          <>
            <span>›</span>
            <span onClick={backToFloors} style={{ cursor: view !== 'floors' ? 'pointer' : 'default', color: view === 'floors' ? '#fafafa' : '#71717a', fontWeight: view === 'floors' ? 700 : 400 }}>Block {selectedBlock.code}</span>
          </>
        )}
        {selectedFloor !== null && (
          <>
            <span>›</span>
            <span style={{ color: '#fafafa', fontWeight: 700 }}>Floor {selectedFloor}</span>
          </>
        )}
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        {view === 'blocks' && 'Room Management'}
        {view === 'floors' && `Block ${selectedBlock?.code} — Select Floor`}
        {view === 'rooms' && `Block ${selectedBlock?.code} · Floor ${selectedFloor}`}
      </h1>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>
        {view === 'blocks' && 'Click a block to drill down into floors and rooms'}
        {view === 'floors' && 'Choose a floor to view its rooms'}
        {view === 'rooms' && 'Click a green room to assign, or a red/orange room to view occupants'}
      </p>

      {/* ═══════════ VIEW: BLOCKS ═══════════ */}
      {view === 'blocks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 700 }}>
          {blockStats.map(({ block, total, occupied, pct }) => {
            const color = pct >= 90 ? '#f43f5e' : pct >= 60 ? '#f59e0b' : '#10b981'
            const genderColor = GENDER_COLOR[block.gender ?? ''] ?? '#71717a'
            return (
              <div
                key={block.id}
                onClick={() => goToBlock(block)}
                style={{
                  background: '#18181b', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '18px 22px', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${genderColor}22`, border: `1px solid ${genderColor}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 800, color: genderColor,
                    }}>{block.code}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa' }}>Block {block.code}</div>
                      <div style={{ fontSize: 11, color: '#71717a', textTransform: 'capitalize' }}>{block.gender ?? '—'} Residence · {total} rooms</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{pct}%</div>
                    <div style={{ fontSize: 10, color: '#71717a' }}>{occupied}/{total} occupied</div>
                  </div>
                </div>
                <div style={{ height: 6, background: '#27272a', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.3s' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══════════ VIEW: FLOORS ═══════════ */}
      {view === 'floors' && selectedBlock && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, maxWidth: 700 }}>
          {floorsInBlock.map(floor => {
            const floorUnitIds = units.filter(u => u.block_id === selectedBlock.id && u.floor === floor).map(u => u.id)
            const floorRooms = rooms.filter(r => floorUnitIds.includes(r.unit_id))
            const occupied = floorRooms.filter(r => !r.is_available).length
            const total = floorRooms.length
            const pct = total > 0 ? Math.round((occupied / total) * 100) : 0
            const color = pct >= 90 ? '#f43f5e' : pct >= 60 ? '#f59e0b' : '#10b981'
            return (
              <div
                key={floor}
                onClick={() => goToFloor(floor)}
                style={{
                  width: 160, background: '#18181b', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '16px 18px', cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Floor {floor}</div>
                <div style={{ fontSize: 11, color: '#71717a', marginBottom: 10 }}>{floorUnitIds.length} units · {total} rooms</div>
                <div style={{ fontSize: 18, fontWeight: 800, color }}>{pct}%</div>
                <div style={{ height: 4, background: '#27272a', borderRadius: 99, overflow: 'hidden', marginTop: 6 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══════════ VIEW: ROOMS ═══════════ */}
      {view === 'rooms' && selectedBlock && selectedFloor !== null && (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} /> Free</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }} /> Limited</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#f43f5e' }} /> Full</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, maxWidth: 900 }}>
            {roomsOnFloor.map(room => {
              const lease = leaseByRoom[room.id]
              const isFull = !room.is_available && lease
              const unit = unitById[room.unit_id]
              const statusColor = isFull ? '#f43f5e' : '#10b981'
              return (
                <div
                  key={room.id}
                  onClick={() => isFull ? setViewingRoom(room) : setAssigningRoom(room)}
                  style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${isFull ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}`,
                    background: isFull ? 'rgba(244,63,94,0.06)' : 'rgba(16,185,129,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                      {selectedBlock.code}{unit?.unit_code}-{room.room_number.replace('Room ', '')}
                    </span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                  </div>
                  {isFull ? (
                    <div>
                      <div style={{ fontSize: 10, color: '#fafafa', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lease.profiles?.full_name}</div>
                      <div style={{ fontSize: 9, color: '#71717a', fontFamily: 'monospace' }}>{lease.profiles?.student_number}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: '#10b981' }}>R{room.monthly_rate ?? '—'}/mo · {room.capacity} beds</div>
                  )}
                </div>
              )
            })}
          </div>
          {roomsOnFloor.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#52525b' }}>No rooms on this floor.</div>
          )}
        </>
      )}

      {/* ── Assign Modal ── */}
      {assigningRoom && (
        <AssignModal
          room={assigningRoom}
          blockCode={selectedBlock?.code ?? ''}
          unitCode={unitById[assigningRoom.unit_id]?.unit_code ?? ''}
          students={students}
          onClose={() => setAssigningRoom(null)}
        />
      )}

      {/* ── View/CheckOut Modal ── */}
      {viewingRoom && (
        <ViewModal
          room={viewingRoom}
          lease={leaseByRoom[viewingRoom.id]}
          blockCode={selectedBlock?.code ?? ''}
          unitCode={unitById[viewingRoom.unit_id]?.unit_code ?? ''}
          onClose={() => setViewingRoom(null)}
        />
      )}
    </div>
  )
}

// ══════════════════════════ ASSIGN MODAL ══════════════════════════
function AssignModal({ room, blockCode, unitCode, students, onClose }: {
  room: Room; blockCode: string; unitCode: string; students: Student[]; onClose: () => void
}) {
  const [studentId, setStudentId] = useState('')
  const [keyNumber, setKeyNumber] = useState('')
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

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
        assigned_key_number: keyNumber || `${blockCode}${unitCode}-${room.room_number.slice(-1)}`,
        key_issued_at: new Date().toISOString(),
        assigned_by: session?.user.id, is_active: true,
      })
      await supabase.from('rooms').update({ is_available: false }).eq('id', room.id)
      onClose()
      router.refresh()
    })
  }

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '9px 12px', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Assign Room</div>
            <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{blockCode}{unitCode}-{room.room_number.replace('Room ', '')}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 10, color: '#71717a', display: 'block', marginBottom: 4 }}>STUDENT</label>
          <select value={studentId} onChange={e => setStudentId(e.target.value)} style={inp}>
            <option value="">Select student…</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name} {s.student_number ? `· ${s.student_number}` : ''}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, color: '#71717a', display: 'block', marginBottom: 4 }}>KEY NUMBER</label>
          <input value={keyNumber} onChange={e => setKeyNumber(e.target.value)} placeholder={`${blockCode}${unitCode}-K1`} style={{ ...inp, fontFamily: 'monospace' }} />
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

// ══════════════════════════ VIEW/CHECKOUT MODAL ══════════════════════════
function ViewModal({ room, lease, blockCode, unitCode, onClose }: {
  room: Room; lease: Lease | undefined; blockCode: string; unitCode: string; onClose: () => void
}) {
  const [pending, startTransition] = useTransition()
  const supabase = createClient()
  const router = useRouter()

  async function handleCheckOut() {
    if (!lease || !confirm(`Check out ${lease.profiles?.full_name}?`)) return
    startTransition(async () => {
      await supabase.from('leases').update({ lease_status: 'Checked-Out', check_out_date: new Date().toISOString(), is_active: false }).eq('id', lease.id)
      await supabase.from('rooms').update({ is_available: true }).eq('id', room.id)
      onClose()
      router.refresh()
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{blockCode}{unitCode}-{room.room_number.replace('Room ', '')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        {lease && (
          <>
            {[['Occupant', lease.profiles?.full_name], ['Student No.', lease.profiles?.student_number], ['Status', lease.lease_status], ['Key', lease.assigned_key_number]].map(([k, v]) => v && (
              <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
                <span style={{ color: '#71717a' }}>{k}</span>
                <span style={{ color: '#fafafa', fontWeight: 600 }}>{String(v)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a', fontSize: 12, cursor: 'pointer' }}>Close</button>
              <button onClick={handleCheckOut} disabled={pending} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: pending ? 0.5 : 1 }}>
                {pending ? '…' : '🚪 Check Out'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
