-- ============================================================================
-- TENTSARI demo data — Supabase SQL editor version
--
-- Paste the SEED block to set up a client demo, the ROLLBACK block to undo it.
-- Both are wrapped in transactions, so a failure anywhere rolls the whole
-- thing back rather than leaving you half-seeded.
--
-- WHY THERE ARE NO LOGINS HERE
-- public.profiles has no foreign key to auth.users, so demo students can exist
-- as plain profile rows. That means this file never touches the auth schema:
-- no auth.users inserts, no hand-rolled bcrypt, nothing that breaks when
-- Supabase changes GoTrue. The trade-off is that nobody can sign in AS a demo
-- student — which does not matter when demoing the admin portal, since you
-- only ever look at these people, never log in as them. If you do need a
-- student login, use scripts/seed-demo.mjs (official Admin API) or the
-- existing glassqa.student@example.com account.
--
-- WHAT IT DOES NOT DO
-- No documents. Rows are easy but the files behind them are not — SQL cannot
-- upload to storage, so every Preview click in the Documents screen would 404
-- mid-demo. The .mjs seeder handles documents properly. Demo the Documents
-- screen with the existing real records, or run the script version.
--
-- SAFETY
-- Nothing real is deleted. The existing students are hidden via is_active, and
-- the exact set is recorded in _demo_hidden_students so ROLLBACK restores only
-- those and not anyone you had deactivated deliberately.
-- ============================================================================


-- ============================================================================
-- SEED
-- ============================================================================
begin;

-- 1. Record and hide the real students -------------------------------------
create table if not exists public._demo_hidden_students (id uuid primary key);

insert into public._demo_hidden_students (id)
select id from public.profiles
where role = 'student' and is_active = true and email not like '%@tentsari.demo'
on conflict (id) do nothing;

update public.profiles set is_active = false
where id in (select id from public._demo_hidden_students);


-- 2. Ten demo students ------------------------------------------------------
insert into public.profiles
  (id, role, full_name, student_number, email, faculty, course, year_of_study,
   student_year_type, funding_type, phone, is_active, onboarding_complete)
values
  ('d0000000-0000-4000-8000-000000000001','student','Lerato Mokoena','224001101','demo01@tentsari.demo','Engineering','Electrical Engineering',2,'senior','NSFAS','0710000001',true,true),
  ('d0000000-0000-4000-8000-000000000002','student','Sipho Ndlovu','224001102','demo02@tentsari.demo','ICT','Computer Science',1,'first_year','NSFAS','0710000002',true,true),
  ('d0000000-0000-4000-8000-000000000003','student','Naledi Khumalo','224001103','demo03@tentsari.demo','Health Sciences','Nursing',3,'senior','Bursary','0710000003',true,true),
  ('d0000000-0000-4000-8000-000000000004','student','Thabo Mahlangu','224001104','demo04@tentsari.demo','Management','Business Administration',2,'senior','Private','0710000004',true,true),
  ('d0000000-0000-4000-8000-000000000005','student','Zanele Dlamini','224001105','demo05@tentsari.demo','Science','Biotechnology',1,'first_year','NSFAS','0710000005',true,true),
  ('d0000000-0000-4000-8000-000000000006','student','Kagiso Molefe','224001106','demo06@tentsari.demo','Engineering','Civil Engineering',4,'senior','TUT_Funded','0710000006',true,true),
  ('d0000000-0000-4000-8000-000000000007','student','Amahle Nkosi','224001107','demo07@tentsari.demo','Humanities','Education',1,'first_year','NSFAS','0710000007',true,true),
  ('d0000000-0000-4000-8000-000000000008','student','Tumelo Sithole','224001108','demo08@tentsari.demo','ICT','Information Technology',2,'senior','Bursary','0710000008',true,true),
  ('d0000000-0000-4000-8000-000000000009','student','Refilwe Baloyi','224001109','demo09@tentsari.demo','Management','Accounting',3,'senior','Private','0710000009',true,true),
  ('d0000000-0000-4000-8000-000000000010','student','Bongani Mabaso','224001110','demo10@tentsari.demo','Science','Environmental Science',1,'first_year','NSFAS','0710000010',true,true)
on conflict (id) do nothing;


-- 3. Applications, spread across states so no screen is empty ---------------
insert into public.applications
  (student_id, academic_year, status, submitted_at, current_academic_average,
   preferred_room_type, financial_status, financial_cleared, reviewed_by, reviewed_at)
select
  p.id,
  extract(year from now())::text,
  v.status::application_status,
  now() - (v.rn || ' days')::interval,
  55 + (v.rn * 4),
  case when v.rn % 2 = 0 then 'Single' else 'Double' end,
  p.funding_type::text,
  p.funding_type <> 'Private',
  case when v.status = 'approved' then (select id from public.profiles where role='admin' order by created_at limit 1) end,
  case when v.status = 'approved' then now() end
from (values
  ('d0000000-0000-4000-8000-000000000001','approved',1),
  ('d0000000-0000-4000-8000-000000000002','approved',2),
  ('d0000000-0000-4000-8000-000000000003','approved',3),
  ('d0000000-0000-4000-8000-000000000004','approved',4),
  ('d0000000-0000-4000-8000-000000000005','approved',5),
  ('d0000000-0000-4000-8000-000000000006','under_review',6),
  ('d0000000-0000-4000-8000-000000000007','under_review',7),
  ('d0000000-0000-4000-8000-000000000008','submitted',8),
  ('d0000000-0000-4000-8000-000000000009','submitted',9),
  ('d0000000-0000-4000-8000-000000000010','submitted',10)
) as v(sid, status, rn)
join public.profiles p on p.id = v.sid::uuid;


-- 4. Leases for the five approved students, from genuinely free rooms -------
with approved as (
  select id, row_number() over (order by id) as rn
  from public.profiles
  where email in ('demo01@tentsari.demo','demo02@tentsari.demo','demo03@tentsari.demo',
                  'demo04@tentsari.demo','demo05@tentsari.demo')
),
free_rooms as (
  select id, row_number() over (order by id) as rn
  from public.rooms where is_available limit 5
)
insert into public.leases
  (student_id, room_id, lease_status, academic_year, lease_start_date, lease_end_date,
   check_in_date, assigned_key_number, key_issued_at, assigned_by, is_active)
select
  a.id, f.id, 'Checked-In', extract(year from now())::text,
  (extract(year from now())::text || '-02-01')::date,
  (extract(year from now())::text || '-11-30')::date,
  now(), 'DEMO-K' || lpad(a.rn::text, 2, '0'), now(),
  (select id from public.profiles where role='admin' order by created_at limit 1), true
from approved a join free_rooms f on f.rn = a.rn;

-- Mark those rooms occupied so the availability counts stay honest.
update public.rooms set is_available = false
where id in (
  select room_id from public.leases
  where is_active and student_id in (select id from public.profiles where email like '%@tentsari.demo')
);


-- 5. Biometrics for the leased students -------------------------------------
insert into public.biometric_registrations
  (student_id, biometric_registered, sync_status, registered_at, device_label, device_id)
select p.id, true, 'synced', now(), 'Admin Panel', 'DEMO-' || left(p.id::text, 8)
from public.profiles p
where p.email in ('demo01@tentsari.demo','demo02@tentsari.demo','demo03@tentsari.demo',
                  'demo04@tentsari.demo','demo05@tentsari.demo');


-- 6. A few offences so Disciplinary has content -----------------------------
insert into public.offences_log
  (student_id, offence_definition_id, incident_date, incident_description, location,
   offence_count_at_time, applied_outcome, fine_amount_applied, logged_by)
select
  p.id, v.def, current_date - v.rn, 'Demo incident logged for presentation purposes.',
  'Block ' || v.blk || ' corridor', 1, v.outcome::disciplinary_outcome, v.fine,
  (select id from public.profiles where role='admin' order by created_at limit 1)
from (values
  ('demo01@tentsari.demo', 2, 5,  'A', 'fine',    250::numeric),
  ('demo02@tentsari.demo', 1, 12, 'B', 'warning', 0::numeric),
  ('demo03@tentsari.demo', 7, 20, 'C', 'warning', 0::numeric)
) as v(email, def, rn, blk, outcome, fine)
join public.profiles p on p.email = v.email;


-- 7. Two students currently signed out, for Pass Tracker --------------------
insert into public.boundary_transits
  (student_id, lease_id, direction, destination, expected_return,
   key_number, key_handed_over, key_returned, logged_by)
select
  p.id,
  (select l.id from public.leases l where l.student_id = p.id and l.is_active limit 1),
  'exit', 'Home visit — Witbank', now() + interval '2 days',
  'DEMO-K01', true, false,
  (select id from public.profiles where role='admin' order by created_at limit 1)
from public.profiles p
where p.email in ('demo01@tentsari.demo','demo02@tentsari.demo');


-- 8. Open maintenance tickets ----------------------------------------------
insert into public.maintenance_requests (room_id, student_id, category, description)
select l.room_id, l.student_id, 'Plumbing', 'Demo ticket: basin tap dripping continuously.'
from public.leases l
join public.profiles p on p.id = l.student_id
where l.is_active and p.email in ('demo03@tentsari.demo','demo04@tentsari.demo');

commit;

-- Check it landed:
--   select full_name, student_number, faculty, is_active
--   from public.profiles where email like '%@tentsari.demo' order by student_number;


-- ============================================================================
-- ROLLBACK — removes the demo data and un-hides the real students
-- ============================================================================
/*
begin;

-- Free the rooms before the leases disappear underneath them.
update public.rooms set is_available = true
where id in (
  select room_id from public.leases
  where is_active and student_id in (select id from public.profiles where email like '%@tentsari.demo')
);

-- These three reference profiles as NO ACTION, not CASCADE. Delete them first
-- or the profile delete below aborts on a foreign key violation partway
-- through, leaving the demo data half-removed.
delete from public.maintenance_requests where student_id in (select id from public.profiles where email like '%@tentsari.demo');
delete from public.inspection_reports   where student_id in (select id from public.profiles where email like '%@tentsari.demo');
delete from public.biometric_audit_log  where student_id in (select id from public.profiles where email like '%@tentsari.demo');

-- The remaining eight tables (applications, leases, offences_log,
-- biometric_registrations, boundary_transits, conduct_acknowledgements,
-- student_documents, upload_attempts) cascade from profiles on their own.
delete from public.profiles where email like '%@tentsari.demo';

-- Restore exactly the students that were hidden, and nobody else.
update public.profiles set is_active = true
where id in (select id from public._demo_hidden_students);

drop table if exists public._demo_hidden_students;

commit;
*/
