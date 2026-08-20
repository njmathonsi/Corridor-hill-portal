'use client'
/**
 * Single-student intake pipeline.
 *
 * The guided flow used to be a chain of redirects — approve pushed you to Room
 * Management, registering biometrics pushed you to Documents — so finishing one
 * student meant four full page loads and losing your place in the queue. This
 * runs the same four mutations from one drawer: the sidebar, the queue behind
 * it, and the scroll position all stay put, and the router is refreshed once at
 * the end rather than after every step.
 *
 * Every step writes the same table shapes as the standalone pages it mirrors
 * (leases + rooms.is_available, biometric_registrations, student_documents via
 * the existing server actions), so the two entry points cannot drift into
 * producing different rows.
 */
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { approveDocument, rejectDocument, getSignedDocumentUrl } from '@/lib/actions/documents'
import { Check, FileText, DoorOpen, Fingerprint, ClipboardCheck, ChevronLeft, ChevronRight } from 'lucide-react'

type StepId = 'application' | 'documents' | 'room' | 'biometrics' | 'done'

const STEPS: { id: StepId; label: string; icon: any }[] = [
  { id: 'application', label: 'Application', icon: ClipboardCheck },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'room', label: 'Room', icon: DoorOpen },
  { id: 'biometrics', label: 'Biometrics', icon: Fingerprint },
  { id: 'done', label: 'Done', icon: Check },
]

interface Props {
  applicationId: string
  studentId: string
  studentName: string
  initialStatus: string
}

export default function ProcessStudentDrawer({ applicationId, studentId, studentName, initialStatus }: Props) {
  const [open, setOpen] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const [appStatus, setAppStatus] = useState(initialStatus)
  const [rejectReason, setRejectReason] = useState('')
  const [docs, setDocs] = useState<any[]>([])
  const [docReason, setDocReason] = useState<Record<string, string>>({})
  const [blocks, setBlocks] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [blockId, setBlockId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [keyNumber, setKeyNumber] = useState('')
  const [leaseStart, setLeaseStart] = useState('')
  const [leaseEnd, setLeaseEnd] = useState('')
  const [roomDone, setRoomDone] = useState(false)
  const [bio, setBio] = useState<any>(null)
  // Gates the portal until after hydration — document does not exist on the server.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const supabase = createClient()
  const router = useRouter()
  const step = STEPS[stepIdx]

  const load = useCallback(async () => {
    const [d, b, u, r, bm] = await Promise.all([
      supabase.from('student_documents').select('id, document_type, status, rejection_reason, original_filename, file_path, uploaded_at').eq('user_id', studentId),
      supabase.from('blocks').select('id, code, description').order('code'),
      supabase.from('units').select('id, unit_code, floor, block_id').order('floor'),
      supabase.from('rooms').select('id, room_number, room_type, capacity, monthly_rate, is_available, unit_id').eq('is_available', true).order('room_number'),
      supabase.from('biometric_registrations').select('id, biometric_registered').eq('student_id', studentId).maybeSingle(),
    ])
    setDocs(d.data ?? [])
    setBlocks(b.data ?? [])
    setUnits(u.data ?? [])
    setRooms(r.data ?? [])
    setBio(bm.data ?? null)
    setLoaded(true)
  }, [studentId, supabase])

  useEffect(() => { if (open && !loaded) load() }, [open, loaded, load])

  const close = useCallback(() => {
    setOpen(false)
    // Only now does the queue behind the drawer need to re-read. Refreshing per
    // step would re-render the list underneath mid-pipeline.
    router.refresh()
  }, [router])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  // PromiseLike, not Promise: a Supabase query builder is a thenable that only
  // executes when awaited, and it has no .catch/.finally, so typing this as
  // Promise rejects every builder passed in directly.
  async function run(fn: () => PromiseLike<any>, onOk?: () => void) {
    setBusy(true)
    setError('')
    try {
      const res = await fn()
      if (res?.error) {
        setError(typeof res.error === 'string' ? res.error : res.error.message)
        return
      }
      onOk?.()
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const approveApp = () => run(
    () => supabase.from('applications').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', applicationId),
    () => { setAppStatus('approved'); setStepIdx(1) },
  )

  const rejectApp = () => run(
    () => supabase.from('applications').update({ status: 'rejected', rejection_reason: rejectReason, reviewed_at: new Date().toISOString() }).eq('id', applicationId),
    () => { setAppStatus('rejected'); setStepIdx(4) },
  )

  const assignRoom = () => run(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const rid = Number(roomId)
    // Deactivate any prior lease first, exactly as AssignRoomModal does — a
    // student holding two active leases corrupts the occupancy counts.
    await supabase.from('leases').update({ is_active: false }).eq('student_id', studentId).eq('is_active', true)
    const { error } = await supabase.from('leases').insert({
      student_id: studentId,
      room_id: rid,
      lease_status: 'Checked-In',
      academic_year: new Date().getFullYear().toString(),
      lease_start_date: leaseStart || new Date().toISOString().split('T')[0],
      lease_end_date: leaseEnd || null,
      check_in_date: new Date().toISOString(),
      assigned_key_number: keyNumber || null,
      key_issued_at: keyNumber ? new Date().toISOString() : null,
      assigned_by: session?.user.id,
      is_active: true,
    })
    if (error) return { error }
    await supabase.from('rooms').update({ is_available: false }).eq('id', rid)
    return {}
  }, () => { setRoomDone(true); setStepIdx(3) })

  const registerBio = () => run(async () => {
    const now = new Date().toISOString()
    if (bio?.id) {
      return supabase.from('biometric_registrations').update({
        biometric_registered: true,
        sync_status: 'synced',
        registered_at: now,
        deregistered_at: null,
        device_label: 'Admin Panel',
        updated_at: now,
      }).eq('id', bio.id)
    }
    return supabase.from('biometric_registrations').insert({
      student_id: studentId,
      biometric_registered: true,
      sync_status: 'synced',
      registered_at: now,
      device_label: 'Admin Panel',
      device_id: 'ADMIN-PANEL-' + studentId.slice(0, 8),
    })
  }, () => { setBio({ ...(bio ?? {}), biometric_registered: true }); setStepIdx(4) })

  async function previewDoc(filePath: string) {
    const { url } = await getSignedDocumentUrl(filePath)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const unitsInBlock = units.filter(u => String(u.block_id) === String(blockId))
  const unitById = new Map(units.map(u => [String(u.id), u]))
  // room_number is only unique within a unit ("Room A" repeats across the whole
  // block), so a flat list has to carry the unit and floor or every option
  // renders identically — RoomExplorer avoids this by drilling in step by step.
  const roomsInBlock = rooms
    .filter(r => unitsInBlock.some(u => String(u.id) === String(r.unit_id)))
    .map(r => {
      const u = unitById.get(String(r.unit_id))
      return { ...r, unitCode: u?.unit_code ?? '—', floor: u?.floor ?? '—' }
    })
    .sort((a, b) => String(a.unitCode).localeCompare(String(b.unitCode)) || String(a.room_number).localeCompare(String(b.room_number)))
  const docsPending = docs.filter(d => d.status === 'pending').length
  const appDone = appStatus === 'approved' || appStatus === 'rejected'

  const stepComplete = (id: StepId) =>
    id === 'application' ? appDone
      : id === 'documents' ? docs.length > 0 && docsPending === 0
        : id === 'room' ? roomDone
          : id === 'biometrics' ? !!bio?.biometric_registered
            : false

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', padding: '8px 10px', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 4, letterSpacing: '0.06em' }

  return (
    <>
      <button onClick={() => setOpen(true)} className="glass-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: 'var(--brand)', border: '1px solid rgb(var(--brand-rgb) / 0.35)' }}>
        Process Student <ChevronRight size={13} />
      </button>

      {/* Portalled to <body>. This button sits inside a .glass-card, whose
          `animation: glassPopIn … both` leaves its transform applied forever,
          and a transformed ancestor becomes the containing block for
          position:fixed — which pinned the drawer inside the card rather than
          the viewport. Rendering at the body root is what makes it full-height. */}
      {open && mounted && createPortal(
        <div
          onClick={e => e.target === e.currentTarget && close()}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 120, display: 'flex', justifyContent: 'flex-end' }}
        >
          <div className="process-drawer" style={{ width: 'min(520px, 100%)', height: '100%', background: '#16161f', borderLeft: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '18px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa' }}>{studentName}</div>
                  <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Intake pipeline · step {stepIdx + 1} of {STEPS.length}</div>
                </div>
                <button onClick={close} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
              </div>

              <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                {STEPS.map((s, i) => {
                  const done = stepComplete(s.id)
                  const active = i === stepIdx
                  const Icon = s.icon
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStepIdx(i)}
                      title={s.label}
                      style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        padding: '6px 2px 10px', background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: `2px solid ${active ? 'var(--brand)' : done ? 'rgba(16,185,129,0.5)' : 'transparent'}`,
                      }}
                    >
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done ? 'rgba(16,185,129,0.15)' : active ? 'rgb(var(--brand-rgb) / 0.18)' : 'rgba(255,255,255,0.05)',
                        color: done ? '#10b981' : active ? 'var(--brand)' : '#52525b',
                      }}>
                        {done ? <Check size={13} /> : <Icon size={13} />}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.04em', color: active ? '#fafafa' : done ? '#10b981' : '#52525b' }}>{s.label.toUpperCase()}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {error && <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', fontSize: 11 }}>{error}</div>}
              {!loaded && <div className="shimmer" style={{ height: 90, borderRadius: 10 }} />}

              {loaded && step.id === 'application' && (
                <>
                  <div style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 14 }}>
                    Current status: <strong style={{ color: '#fafafa' }}>{appStatus.replace('_', ' ')}</strong>
                  </div>
                  {appDone ? (
                    <div style={{ fontSize: 12, color: '#10b981' }}>Application already decided — continue to documents.</div>
                  ) : (
                    <>
                      <button onClick={approveApp} disabled={busy} style={{ width: '100%', padding: 11, borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.5 : 1, marginBottom: 12 }}>
                        {busy ? 'Approving…' : '✓ Approve & Continue'}
                      </button>
                      <label style={lbl}>OR REJECT WITH REASON</label>
                      <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection…" style={inp} />
                      <button onClick={rejectApp} disabled={busy || !rejectReason.trim()} style={{ width: '100%', marginTop: 8, padding: 9, borderRadius: 8, background: 'transparent', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', fontSize: 12, fontWeight: 600, cursor: rejectReason.trim() ? 'pointer' : 'not-allowed', opacity: rejectReason.trim() ? 1 : 0.4 }}>
                        Reject Application
                      </button>
                    </>
                  )}
                </>
              )}

              {loaded && step.id === 'documents' && (
                <>
                  {docs.length === 0 && <div style={{ fontSize: 12, color: '#71717a' }}>This student has not uploaded any documents yet.</div>}
                  {docs.map(d => (
                    <div key={d.id} className="glass-card" style={{ padding: 14, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#fafafa' }}>{d.document_type.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: 10, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.original_filename}</div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, flexShrink: 0,
                          background: d.status === 'approved' ? 'rgba(16,185,129,0.15)' : d.status === 'rejected' ? 'rgba(244,63,94,0.12)' : 'rgb(var(--brand-rgb) / 0.15)',
                          color: d.status === 'approved' ? '#10b981' : d.status === 'rejected' ? '#f43f5e' : 'var(--brand)',
                        }}>{d.status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button onClick={() => previewDoc(d.file_path)} style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 10, cursor: 'pointer' }}>Preview</button>
                        {d.status !== 'approved' && (
                          <button onClick={() => run(() => approveDocument(d.id), () => setDocs(ds => ds.map(x => x.id === d.id ? { ...x, status: 'approved' } : x)))} disabled={busy}
                            style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                        )}
                        {d.status !== 'rejected' && (
                          <>
                            <input value={docReason[d.id] ?? ''} onChange={e => setDocReason(m => ({ ...m, [d.id]: e.target.value }))} placeholder="Reject reason…" style={{ ...inp, width: 'auto', flex: 1, minWidth: 110, fontSize: 10, padding: '5px 8px' }} />
                            <button onClick={() => run(() => rejectDocument(d.id, docReason[d.id] ?? ''), () => setDocs(ds => ds.map(x => x.id === d.id ? { ...x, status: 'rejected' } : x)))} disabled={busy || !(docReason[d.id] ?? '').trim()}
                              style={{ padding: '5px 10px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', fontSize: 10, fontWeight: 600, cursor: 'pointer', opacity: (docReason[d.id] ?? '').trim() ? 1 : 0.4 }}>Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {loaded && step.id === 'room' && (
                roomDone ? <div style={{ fontSize: 12, color: '#10b981' }}>Room assigned and student checked in.</div> : (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <label style={lbl}>BLOCK</label>
                      <select value={blockId} onChange={e => { setBlockId(e.target.value); setRoomId('') }} style={inp}>
                        <option value="">Select block…</option>
                        {blocks.map(b => <option key={b.id} value={b.id}>{b.code} — {b.description}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={lbl}>AVAILABLE ROOM</label>
                      <select value={roomId} onChange={e => setRoomId(e.target.value)} disabled={!blockId} style={{ ...inp, opacity: blockId ? 1 : 0.5 }}>
                        <option value="">{blockId ? (roomsInBlock.length ? 'Select room…' : 'No available rooms in this block') : 'Pick a block first'}</option>
                        {roomsInBlock.map(r => <option key={r.id} value={r.id}>{r.unitCode} · Floor {r.floor} · {r.room_number} · {r.room_type} · R{r.monthly_rate}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={lbl}>KEY NUMBER</label>
                      <input value={keyNumber} onChange={e => setKeyNumber(e.target.value)} placeholder="e.g. A01-K1" style={{ ...inp, fontFamily: 'monospace' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                      <div><label style={lbl}>LEASE START</label><input type="date" value={leaseStart} onChange={e => setLeaseStart(e.target.value)} style={inp} /></div>
                      <div><label style={lbl}>LEASE END</label><input type="date" value={leaseEnd} onChange={e => setLeaseEnd(e.target.value)} style={inp} /></div>
                    </div>
                    <button onClick={assignRoom} disabled={!roomId || busy} style={{ width: '100%', padding: 11, borderRadius: 8, background: roomId ? '#10b981' : '#27272a', color: roomId ? '#fff' : '#52525b', border: 'none', fontSize: 13, fontWeight: 700, cursor: roomId ? 'pointer' : 'not-allowed', opacity: busy ? 0.5 : 1 }}>
                      {busy ? 'Assigning…' : '✓ Assign & Check In'}
                    </button>
                  </>
                )
              )}

              {loaded && step.id === 'biometrics' && (
                bio?.biometric_registered
                  ? <div style={{ fontSize: 12, color: '#10b981' }}>Biometrics already registered for this student.</div>
                  : <button onClick={registerBio} disabled={busy} style={{ width: '100%', padding: 11, borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.5 : 1 }}>
                    {busy ? 'Registering…' : '✓ Register Biometrics & Continue'}
                  </button>
              )}

              {loaded && step.id === 'done' && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa', marginBottom: 12 }}>Intake summary</div>
                  {STEPS.slice(0, 4).map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
                      <span style={{ color: '#a1a1aa' }}>{s.label}</span>
                      <span style={{ color: stepComplete(s.id) ? '#10b981' : '#71717a', fontWeight: 600 }}>{stepComplete(s.id) ? 'Complete' : 'Skipped'}</span>
                    </div>
                  ))}
                  <button onClick={close} style={{ width: '100%', marginTop: 18, padding: 11, borderRadius: 8, background: 'linear-gradient(135deg,var(--brand-deep),var(--brand))', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Finish &amp; Return to Queue
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => setStepIdx(i => Math.max(0, i - 1))} disabled={stepIdx === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a', fontSize: 12, cursor: stepIdx === 0 ? 'not-allowed' : 'pointer', opacity: stepIdx === 0 ? 0.4 : 1 }}>
                <ChevronLeft size={13} /> Back
              </button>
              <button onClick={() => setStepIdx(i => Math.min(STEPS.length - 1, i + 1))} disabled={stepIdx === STEPS.length - 1}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa', fontSize: 12, fontWeight: 600, cursor: stepIdx === STEPS.length - 1 ? 'not-allowed' : 'pointer', opacity: stepIdx === STEPS.length - 1 ? 0.4 : 1 }}>
                Skip / Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
