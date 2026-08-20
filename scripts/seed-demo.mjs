/**
 * Demo data seeder / rollback for client demos.
 *
 *   node --env-file=.env.local scripts/seed-demo.mjs seed
 *   node --env-file=.env.local scripts/seed-demo.mjs rollback
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (already in .env.local, gitignored) and
 * DEMO_PASSWORD. Node 24 loads the env file natively, so there is nothing to
 * install.
 *
 * SAFETY — read before running:
 *
 * - Nothing real is ever deleted. `seed` only flips is_active=false on the
 *   existing students so they drop out of every list; their rows, their
 *   uploaded ID documents and their storage files are untouched. The ids it
 *   deactivated are recorded in scripts/.demo-state.json so `rollback`
 *   reactivates exactly those and not any account that was already inactive
 *   for its own reasons.
 * - Every demo account lives on @tentsari.demo, and rollback refuses to delete
 *   any user whose email does not end in that domain. That assertion is the
 *   only thing standing between a rollback and a real record, so it is checked
 *   per user immediately before the delete call rather than once up front.
 * - Rollback clears the NO ACTION references (maintenance_requests,
 *   inspection_reports, biometric_audit_log) before deleting profiles. Those
 *   foreign keys do not cascade, so skipping this makes the delete fail
 *   partway and leave the data half-removed.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const STATE_FILE = join(HERE, '.demo-state.json')
const DEMO_DOMAIN = '@tentsari.demo'
const BUCKET = 'student-documents'
const YEAR = String(new Date().getFullYear())

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const password = process.env.DEMO_PASSWORD || process.argv[3]

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Run with:  node --env-file=.env.local scripts/seed-demo.mjs <seed|rollback>')
  process.exit(1)
}

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

// A real 1x1 PNG. The seeder writes to storage with the service role and so
// bypasses the magic-byte check in the upload action — but a placeholder that
// is not a decodable image would still 404 the admin preview during a demo.
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

const STUDENTS = [
  { name: 'Lerato Mokoena',    num: '224001101', faculty: 'Engineering',      course: 'Electrical Engineering',   year: 2, type: 'senior',     funding: 'NSFAS' },
  { name: 'Sipho Ndlovu',      num: '224001102', faculty: 'ICT',              course: 'Computer Science',         year: 1, type: 'first_year', funding: 'NSFAS' },
  { name: 'Naledi Khumalo',    num: '224001103', faculty: 'Health Sciences',  course: 'Nursing',                  year: 3, type: 'senior',     funding: 'Bursary' },
  { name: 'Thabo Mahlangu',    num: '224001104', faculty: 'Management',       course: 'Business Administration',  year: 2, type: 'senior',     funding: 'Private' },
  { name: 'Zanele Dlamini',    num: '224001105', faculty: 'Science',          course: 'Biotechnology',            year: 1, type: 'first_year', funding: 'NSFAS' },
  { name: 'Kagiso Molefe',     num: '224001106', faculty: 'Engineering',      course: 'Civil Engineering',        year: 4, type: 'senior',     funding: 'TUT_Funded' },
  { name: 'Amahle Nkosi',      num: '224001107', faculty: 'Humanities',       course: 'Education',                year: 1, type: 'first_year', funding: 'NSFAS' },
  { name: 'Tumelo Sithole',    num: '224001108', faculty: 'ICT',              course: 'Information Technology',   year: 2, type: 'senior',     funding: 'Bursary' },
  { name: 'Refilwe Baloyi',    num: '224001109', faculty: 'Management',       course: 'Accounting',               year: 3, type: 'senior',     funding: 'Private' },
  { name: 'Bongani Mabaso',    num: '224001110', faculty: 'Science',          course: 'Environmental Science',    year: 1, type: 'first_year', funding: 'NSFAS' },
]

// Spread across states so every dashboard has something to show rather than
// ten identical rows.
const APP_STATUS = ['approved', 'approved', 'approved', 'approved', 'approved', 'under_review', 'under_review', 'submitted', 'submitted', 'submitted']
const emailFor = i => `demo${String(i + 1).padStart(2, '0')}${DEMO_DOMAIN}`

const log = (...a) => console.log(...a)
const die = (m, e) => { console.error(`\n✗ ${m}`, e?.message ?? e ?? ''); process.exit(1) }

async function adminId() {
  const { data } = await db.from('profiles').select('id').eq('role', 'admin').order('created_at').limit(1).maybeSingle()
  if (!data) die('No admin profile found — one is needed for logged_by / assigned_by / reviewed_by.')
  return data.id
}

// ─────────────────────────────────────────────────────────── seed
async function seed() {
  if (!password) die('Set DEMO_PASSWORD, or pass it as the 2nd argument:\n  node --env-file=.env.local scripts/seed-demo.mjs seed "YourDemoPass123!"')
  if (password.length < 6) die('DEMO_PASSWORD must be at least 6 characters.')

  const reviewer = await adminId()

  // 1. Hide the real students. Only currently-active, non-demo ones, and
  //    remember exactly which so rollback cannot reactivate the wrong set.
  const { data: real, error: realErr } = await db
    .from('profiles').select('id, full_name, email')
    .eq('role', 'student').eq('is_active', true)
    .not('email', 'like', `%${DEMO_DOMAIN}`)
  if (realErr) die('Could not read existing students', realErr)

  const deactivated = (real ?? []).map(r => r.id)
  if (deactivated.length) {
    const { error } = await db.from('profiles').update({ is_active: false }).in('id', deactivated)
    if (error) die('Could not deactivate existing students', error)
    // Written BEFORE the accounts are created, not at the end of the run. If
    // account creation fails halfway, the real students are already hidden —
    // and without this file on disk, rollback has no record of who to restore.
    writeFileSync(STATE_FILE, JSON.stringify({ deactivated, seededAt: new Date().toISOString() }, null, 2))
    log(`• Deactivated ${deactivated.length} existing student(s) — hidden, not deleted:`)
    for (const r of real) log(`    ${r.full_name} <${r.email}>`)
  } else {
    writeFileSync(STATE_FILE, JSON.stringify({ deactivated: [], seededAt: new Date().toISOString() }, null, 2))
    log('• No active non-demo students to hide.')
  }

  // 2. Accounts. createUser fires the trigger that inserts the profile row, so
  //    the profile is UPDATEd afterwards — the same order accounts.ts uses.
  const made = []
  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i]
    const email = emailFor(i)

    const { data: created, error: cErr } = await db.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: s.name },
    })
    if (cErr) {
      if (/already/i.test(cErr.message)) { log(`  – ${email} already exists, skipping`); continue }
      die(`Could not create ${email}`, cErr)
    }

    const id = created.user.id
    const { error: pErr } = await db.from('profiles').update({
      full_name: s.name, role: 'student', student_number: s.num,
      faculty: s.faculty, course: s.course, year_of_study: s.year,
      student_year_type: s.type, funding_type: s.funding,
      phone: `07${String(10000000 + i * 111111).slice(0, 8)}`,
      is_active: true, onboarding_complete: true,
    }).eq('id', id)
    if (pErr) {
      await db.auth.admin.deleteUser(id) // don't leave an orphaned auth user
      die(`Could not write profile for ${email}`, pErr)
    }

    made.push({ id, email, ...s, status: APP_STATUS[i] })
    log(`  ✓ ${s.name} <${email}>`)
  }

  // 3. Applications
  for (const m of made) {
    const decided = m.status === 'approved' || m.status === 'rejected'
    const { error } = await db.from('applications').insert({
      student_id: m.id, academic_year: YEAR, status: m.status,
      submitted_at: new Date(Date.now() - Math.random() * 30 * 864e5).toISOString(),
      current_academic_average: 55 + Math.floor(Math.random() * 40),
      preferred_room_type: Math.random() > 0.5 ? 'Single' : 'Double',
      financial_status: m.funding, financial_cleared: m.funding !== 'Private',
      ...(decided ? { reviewed_by: reviewer, reviewed_at: new Date().toISOString() } : {}),
    })
    if (error) die(`Application insert failed for ${m.email}`, error)
  }
  log(`• ${made.length} application(s) created`)

  // 4. Leases for the approved students, taken from genuinely free rooms.
  const approved = made.filter(m => m.status === 'approved')
  const { data: freeRooms } = await db.from('rooms').select('id, room_number').eq('is_available', true).order('id').limit(approved.length)
  let leased = 0
  for (let i = 0; i < approved.length && i < (freeRooms?.length ?? 0); i++) {
    const m = approved[i], room = freeRooms[i]
    const { error } = await db.from('leases').insert({
      student_id: m.id, room_id: room.id, lease_status: 'Checked-In', academic_year: YEAR,
      lease_start_date: `${YEAR}-02-01`, lease_end_date: `${YEAR}-11-30`,
      check_in_date: new Date().toISOString(),
      assigned_key_number: `DEMO-K${String(i + 1).padStart(2, '0')}`,
      key_issued_at: new Date().toISOString(), assigned_by: reviewer, is_active: true,
    })
    if (error) die(`Lease insert failed for ${m.email}`, error)
    await db.from('rooms').update({ is_available: false }).eq('id', room.id)
    m.roomId = room.id
    leased++
  }
  log(`• ${leased} lease(s) created and rooms marked occupied`)

  // 5. Biometrics for the leased students
  for (const m of approved.filter(x => x.roomId)) {
    await db.from('biometric_registrations').insert({
      student_id: m.id, biometric_registered: true, sync_status: 'synced',
      registered_at: new Date().toISOString(), device_label: 'Admin Panel',
      device_id: 'DEMO-' + m.id.slice(0, 8),
    })
  }
  log(`• Biometrics registered for ${approved.filter(x => x.roomId).length} student(s)`)

  // 6. Documents, with a real (if tiny) file behind each so preview works.
  let docs = 0
  for (const m of made.slice(0, 5)) {
    for (const type of ['id_document', 'proof_of_registration']) {
      const path = `${m.id}/${type}/${Date.now()}.png`
      const { error: upErr } = await db.storage.from(BUCKET).upload(path, PLACEHOLDER_PNG, { contentType: 'image/png', upsert: true })
      if (upErr) { log(`  ! storage upload skipped (${upErr.message})`); continue }
      const approvedDoc = Math.random() > 0.4
      await db.from('student_documents').upsert({
        user_id: m.id, document_type: type, file_path: path,
        original_filename: `${type}-demo.png`, file_size_bytes: PLACEHOLDER_PNG.length,
        mime_type: 'image/png', status: approvedDoc ? 'approved' : 'pending',
        uploaded_at: new Date().toISOString(),
        ...(approvedDoc ? { reviewed_at: new Date().toISOString(), reviewed_by: reviewer } : {}),
      }, { onConflict: 'user_id,document_type' })
      docs++
    }
  }
  log(`• ${docs} document(s) uploaded`)

  // 7. A couple of offences so Disciplinary is not empty
  const offenders = approved.slice(0, 3)
  for (let i = 0; i < offenders.length; i++) {
    const { data: lease } = await db.from('leases').select('id').eq('student_id', offenders[i].id).eq('is_active', true).maybeSingle()
    await db.from('offences_log').insert({
      student_id: offenders[i].id, offence_definition_id: (i % 8) + 1,
      incident_date: new Date(Date.now() - (i + 1) * 5 * 864e5).toISOString().slice(0, 10),
      incident_description: 'Demo incident logged for presentation purposes.',
      location: `Block ${'ABCDEF'[i % 6]} corridor`,
      offence_count_at_time: 1, applied_outcome: i === 0 ? 'fine' : 'warning',
      fine_amount_applied: i === 0 ? 250 : 0, logged_by: reviewer,
    })
    void lease
  }
  log(`• ${offenders.length} offence(s) logged`)

  // 8. Pass Tracker activity — two students currently signed out
  for (const m of approved.slice(0, 2)) {
    const { data: lease } = await db.from('leases').select('id').eq('student_id', m.id).eq('is_active', true).maybeSingle()
    await db.from('boundary_transits').insert({
      student_id: m.id, lease_id: lease?.id ?? null, direction: 'exit',
      destination: 'Home visit — Witbank', expected_return: new Date(Date.now() + 2 * 864e5).toISOString(),
      key_number: 'DEMO-K01', key_handed_over: true, key_returned: false, logged_by: reviewer,
    })
  }
  log('• 2 open exit pass(es) created')

  // 9. Maintenance tickets
  for (const m of approved.filter(x => x.roomId).slice(0, 2)) {
    await db.from('maintenance_requests').insert({
      room_id: m.roomId, student_id: m.id, category: 'Plumbing',
      description: 'Demo ticket: basin tap dripping continuously.',
    })
  }
  log('• 2 maintenance ticket(s) created')

  log(`\n✓ Demo ready. ${made.length} students on ${DEMO_DOMAIN}, password as supplied.`)
  log(`  Login example: ${emailFor(0)}`)
  log(`  State written to scripts/.demo-state.json — needed for rollback.`)
}

// ─────────────────────────────────────────────────────────── rollback
async function rollback() {
  const { data: demo, error } = await db.from('profiles').select('id, email, full_name').like('email', `%${DEMO_DOMAIN}`)
  if (error) die('Could not list demo accounts', error)

  if (!demo?.length) {
    log('• No demo accounts found.')
  } else {
    const ids = demo.map(d => d.id)

    // Free the rooms before the leases disappear underneath them.
    const { data: leases } = await db.from('leases').select('room_id').in('student_id', ids).eq('is_active', true)
    for (const l of leases ?? []) await db.from('rooms').update({ is_available: true }).eq('id', l.room_id)

    // These three do NOT cascade — without clearing them the delete below
    // fails on a foreign key violation halfway through.
    await db.from('maintenance_requests').delete().in('student_id', ids)
    await db.from('inspection_reports').delete().in('student_id', ids)
    await db.from('biometric_audit_log').delete().in('student_id', ids)

    for (const d of demo) {
      // Re-assert per user: this is the guard that keeps a real account safe.
      if (!d.email?.endsWith(DEMO_DOMAIN)) { log(`  ! refusing to delete non-demo account ${d.email}`); continue }
      const { data: files } = await db.storage.from(BUCKET).list(d.id, { limit: 100 })
      for (const f of files ?? []) {
        const { data: inner } = await db.storage.from(BUCKET).list(`${d.id}/${f.name}`, { limit: 100 })
        if (inner?.length) await db.storage.from(BUCKET).remove(inner.map(x => `${d.id}/${f.name}/${x.name}`))
      }
      const { error: dErr } = await db.auth.admin.deleteUser(d.id)
      if (dErr) log(`  ! could not delete ${d.email}: ${dErr.message}`)
      else log(`  ✓ removed ${d.full_name} <${d.email}>`)
    }
  }

  if (existsSync(STATE_FILE)) {
    const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'))
    if (state.deactivated?.length) {
      const { error: rErr } = await db.from('profiles').update({ is_active: true }).in('id', state.deactivated)
      if (rErr) die('Could not reactivate the original students', rErr)
      log(`• Reactivated ${state.deactivated.length} original student(s)`)
    }
  } else {
    log('• No scripts/.demo-state.json — original students left as they are.')
  }

  log('\n✓ Rollback complete.')
}

const cmd = process.argv[2]
if (cmd === 'seed') await seed()
else if (cmd === 'rollback') await rollback()
else {
  console.log('Usage:\n  node --env-file=.env.local scripts/seed-demo.mjs seed "DemoPass123!"\n  node --env-file=.env.local scripts/seed-demo.mjs rollback')
  process.exit(1)
}
