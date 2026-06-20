'use client'
// components/room-management/RoomGrid.tsx
import { useState, useTransition } from 'react'
import { assignRoom, checkOutStudent, updateLeaseStatus } from '@/lib/actions/room-management'
import { useToast } from '@/components/ui/use-toast'

interface Room {
  id: number
  room_number: string
  room_type: string | null
  capacity: number
  monthly_rate: number | null
  is_available: boolean
  notes: string | null
  units: { id: number; unit_code: string; floor: number; block_id: number; blocks: { code: string } } | null
}

interface Lease {
  id: string
  lease_status: string
  assigned_key_number: string | null
  check_in_date: string | null
  student_id: string
  room_id: number
  profiles: { full_name: string; student_number: string } | null
}

interface Student {
  id: string; full_name: string; student_number: string; course: string | null; faculty: string | null
}

interface Props {
  byBlock: Record<string, { blockCode: string; rooms: Room[] }>
  leaseByRoom: Record<number, Lease>
  students: Student[]
}

export default function RoomGrid({ byBlock, leaseByRoom, students }: Props) {
  const [assigningRoom, setAssigningRoom] = useState<Room | null>(null)
  const [viewingRoom, setViewingRoom]     = useState<Room | null>(null)
  const [selectedStudent, setStudentSel] = useState('')
  const [keyNumber, setKeyNumber]        = useState('')
  const [leaseStart, setLeaseStart]      = useState('')
  const [leaseEnd, setLeaseEnd]          = useState('')
  const [blockFilter, setBlockFilter]    = useState<string>('ALL')
  const [showAvailOnly, setAvailOnly]    = useState(false)
  const [isPending, startTransition]     = useTransition()
  const { toast } = useToast()

  const blocks = Object.keys(byBlock).sort()

  function handleAssign() {
    if (!assigningRoom || !selectedStudent) {
      toast({ title: 'Missing fields', description: 'Please select a student', variant: 'destructive' })
      return
    }
    startTransition(async () => {
      const result = await assignRoom({
        roomId: assigningRoom.id,
        studentId: selectedStudent,
        keyNumber,
        leaseStartDate: leaseStart || undefined,
        leaseEndDate: leaseEnd || undefined,
      })
      if (result.success) {
        const s = students.find(s => s.id === selectedStudent)
        toast({ title: '✅ Room Assigned', description: `${s?.full_name} → Block ${assigningRoom.units?.blocks?.code} · ${assigningRoom.room_number}` })
        setAssigningRoom(null); setStudentSel(''); setKeyNumber(''); setLeaseStart(''); setLeaseEnd('')
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    })
  }

  function handleCheckOut(lease: Lease, room: Room) {
    startTransition(async () => {
      const result = await checkOutStudent(lease.id, room.id)
      if (result.success) {
        toast({ title: '🚪 Checked Out', description: `${lease.profiles?.full_name} checked out of ${room.room_number}` })
        setViewingRoom(null)
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    })
  }

  const inputStyle = {
    background: 'var(--bg-raised)', border: '1px solid var(--border-mid)',
    color: 'var(--text-primary)', padding: '8px 10px',
    borderRadius: 'var(--r-md)', fontSize: 12, fontFamily: 'inherit',
    width: '100%', outline: 'none',
  }
  const labelStyle = {
    fontSize: 10, fontWeight: 600 as const, color: 'var(--text-secondary)',
    letterSpacing: '0.04em', textTransform: 'uppercase' as const,
    display: 'block' as const, marginBottom: 4,
  }

  return (
    <>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['ALL', ...blocks].map(b => (
            <button key={b}
              onClick={() => setBlockFilter(b)}
              style={{
                padding: '5px 12px', borderRadius: 'var(--r-md)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${blockFilter === b ? 'var(--blue-ring)' : 'var(--border-dim)'}`,
                background: blockFilter === b ? 'var(--blue-dim)' : 'var(--bg-raised)',
                color: blockFilter === b ? 'var(--blue)' : 'var(--text-secondary)',
              }}
            >
              {b === 'ALL' ? 'All Blocks' : `Block ${b}`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAvailOnly(v => !v)}
          style={{
            padding: '5px 12px', borderRadius: 'var(--r-md)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${showAvailOnly ? 'var(--emerald-ring)' : 'var(--border-dim)'}`,
            background: showAvailOnly ? 'var(--emerald-dim)' : 'var(--bg-raised)',
            color: showAvailOnly ? 'var(--emerald)' : 'var(--text-secondary)',
          }}
        >
          {showAvailOnly ? '✓ ' : ''}Available Only
        </button>
      </div>

      {/* Block sections */}
      {blocks
        .filter(b => blockFilter === 'ALL' || b === blockFilter)
        .map(blockCode => {
          const { rooms } = byBlock[blockCode]
          const filtered = rooms.filter(r => !showAvailOnly || r.is_available)
          if (filtered.length === 0) return null

          // Group by unit
          const byUnit: Record<string, Room[]> = {}
          for (const room of filtered) {
            const uk = room.units?.unit_code ?? '?'
            if (!byUnit[uk]) byUnit[uk] = []
            byUnit[uk].push(room)
          }

          return (
            <div key={blockCode} style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--text-secondary)', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span>Block {blockCode}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
                <span style={{ fontWeight: 400, color: 'var(--text-disabled)' }}>
                  {rooms.filter(r => !r.is_available).length}/{rooms.length} occupied
                </span>
              </div>

              {Object.entries(byUnit).sort(([a], [b]) => a.localeCompare(b)).map(([unitCode, unitRooms]) => (
                <div key={unitCode} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 6, letterSpacing: '0.06em' }}>
                    Unit {blockCode}{unitCode}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {unitRooms.map(room => {
                      const lease = leaseByRoom[room.id]
                      const occupied = !room.is_available && lease

                      return (
                        <div
                          key={room.id}
                          onClick={() => occupied ? setViewingRoom(room) : setAssigningRoom(room)}
                          style={{
                            width: 140, padding: '10px 12px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                            border: `1px solid ${occupied ? 'var(--border-mid)' : 'var(--emerald-ring)'}`,
                            background: occupied ? 'var(--bg-raised)' : 'var(--emerald-dim)',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
                              {room.room_number}
                            </span>
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 99,
                              background: occupied ? 'var(--bg-active)' : 'var(--emerald)',
                              color: occupied ? 'var(--text-secondary)' : '#fff',
                            }}>
                              {occupied ? 'OCC' : 'FREE'}
                            </span>
                          </div>
                          {occupied && lease?.profiles ? (
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {lease.profiles.full_name}
                              </div>
                              <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace', marginTop: 1 }}>
                                {lease.profiles.student_number}
                              </div>
                              {lease.assigned_key_number && (
                                <div style={{ fontSize: 9, color: 'var(--amber)', marginTop: 3 }}>
                                  🔑 {lease.assigned_key_number}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: 10, color: 'var(--emerald)' }}>
                              {room.room_type ?? 'Single'} · R{room.monthly_rate ?? '—'}/mo
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        })}

      {/* ── Assign Room Modal ── */}
      {assigningRoom && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
        }} onClick={e => e.target === e.currentTarget && setAssigningRoom(null)}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
            borderRadius: 'var(--r-lg)', padding: 24, width: '100%', maxWidth: 440,
            animation: 'modalIn 0.18s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Assign Room</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Block {assigningRoom.units?.blocks?.code} · Unit {assigningRoom.units?.blocks?.code}{assigningRoom.units?.unit_code} · {assigningRoom.room_number}
                </div>
              </div>
              <button onClick={() => setAssigningRoom(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Student</label>
              <select value={selectedStudent} onChange={e => setStudentSel(e.target.value)} style={inputStyle}>
                <option value="">Select student to assign…</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} · {s.student_number} {s.course ? `· ${s.course}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Key Number</label>
              <input
                value={keyNumber}
                onChange={e => setKeyNumber(e.target.value)}
                placeholder={`e.g. ${assigningRoom.units?.blocks?.code}${assigningRoom.units?.unit_code}-K1`}
                style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Lease Start</label>
                <input type="date" value={leaseStart} onChange={e => setLeaseStart(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Lease End</label>
                <input type="date" value={leaseEnd} onChange={e => setLeaseEnd(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setAssigningRoom(null)}
                style={{ flex: 1, padding: '9px', borderRadius: 'var(--r-md)', background: 'transparent', border: '1px solid var(--border-mid)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={handleAssign}
                disabled={isPending || !selectedStudent}
                style={{
                  flex: 2, padding: '9px', borderRadius: 'var(--r-md)',
                  background: selectedStudent ? 'var(--emerald)' : 'var(--bg-raised)',
                  color: selectedStudent ? '#fff' : 'var(--text-disabled)',
                  border: `1px solid ${selectedStudent ? 'var(--emerald)' : 'var(--border-dim)'}`,
                  fontSize: 13, fontWeight: 700, cursor: selectedStudent ? 'pointer' : 'not-allowed',
                  opacity: isPending ? 0.5 : 1,
                }}
              >
                {isPending ? 'Assigning…' : '✓ Assign & Check In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Occupied Room Modal ── */}
      {viewingRoom && (() => {
        const lease = leaseByRoom[viewingRoom.id]
        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20,
          }} onClick={e => e.target === e.currentTarget && setViewingRoom(null)}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
              borderRadius: 'var(--r-lg)', padding: 24, width: '100%', maxWidth: 400,
              animation: 'modalIn 0.18s ease both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  Block {viewingRoom.units?.blocks?.code} · {viewingRoom.room_number}
                </div>
                <button onClick={() => setViewingRoom(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>

              {lease && (
                <>
                  {[
                    ['Occupant',    lease.profiles?.full_name],
                    ['Student No.', lease.profiles?.student_number],
                    ['Status',      lease.lease_status],
                    ['Key Number',  lease.assigned_key_number],
                    ['Check-In',    lease.check_in_date ? new Date(lease.check_in_date).toLocaleDateString('en-ZA') : '—'],
                  ].map(([k, v]) => v && (
                    <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-dim)', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>{k}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{String(v)}</span>
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button
                      onClick={() => setViewingRoom(null)}
                      style={{ flex: 1, padding: '8px', borderRadius: 'var(--r-md)', background: 'transparent', border: '1px solid var(--border-mid)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
                    >Close</button>
                    <button
                      onClick={() => handleCheckOut(lease, viewingRoom)}
                      disabled={isPending}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 'var(--r-md)',
                        background: 'var(--rose-dim)', color: 'var(--rose)',
                        border: '1px solid var(--rose-ring)', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', opacity: isPending ? 0.5 : 1,
                      }}
                    >
                      🚪 Check Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })()}
    </>
  )
}
