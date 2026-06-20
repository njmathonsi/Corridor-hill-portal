# Corridor Hill — Complete Implementation Guide
## File Mapping, Deployment Checklist & Developer Handoff

---

## COMPLETE FILE MAP

Every file generated across all three sessions maps to the exact Next.js path below.
Copy each file's content into its destination path.

---

### Root Configuration

| Source File | Destination Path |
|---|---|
| `package.json` | `/package.json` |
| `config-files.ts` → **tailwind section** | `/tailwind.config.ts` |
| `config-files.ts` → **next section** | `/next.config.ts` |
| `globals.css` | `/app/globals.css` |
| `middleware.ts` *(from Part 4 of architecture doc)* | `/middleware.ts` |

---

### App Router — Layouts & Root

| Source File | Destination Path |
|---|---|
| `app-layout.tsx` | `/app/layout.tsx` |
| `admin-layout.tsx` | `/app/dashboard/admin/layout.tsx` |
| `student-layout.tsx` | `/app/dashboard/student/layout.tsx` |

---

### Auth Pages

| Source File | Destination Path |
|---|---|
| `login-page.tsx` | `/app/auth/login/page.tsx` |
| `LoginForm.tsx` | `/app/auth/login/LoginForm.tsx` |
| `auth-callback-route.ts` | `/app/auth/callback/route.ts` |

---

### Admin Pages

| Source File | Destination Path |
|---|---|
| `overview-page.tsx` | `/app/dashboard/admin/overview/page.tsx` |
| `biometrics-hub-page.tsx` | `/app/dashboard/admin/biometrics-hub/page.tsx` |
| `pass-tracker-page.tsx` | `/app/dashboard/admin/pass-tracker/page.tsx` |
| `move-out-audit-page.tsx` | `/app/dashboard/admin/move-out-audit/page.tsx` |
| `inspection-report-view.tsx` | `/app/dashboard/admin/move-out-audit/[reportId]/page.tsx` |
| `applications-page.tsx` | `/app/dashboard/admin/applications/page.tsx` |
| `room-management-page.tsx` | `/app/dashboard/admin/room-management/page.tsx` |
| `disciplinary-page.tsx` | `/app/dashboard/admin/disciplinary/page.tsx` |
| `log-offence-page.tsx` | `/app/dashboard/admin/disciplinary/log/page.tsx` |
| `OffenceLogClient.tsx` | `/app/dashboard/admin/disciplinary/log/OffenceLogClient.tsx` |

---

### Student Pages

| Source File | Destination Path |
|---|---|
| `student-home-page.tsx` | `/app/dashboard/student/home/page.tsx` |
| `my-room-page.tsx` | `/app/dashboard/student/my-room/page.tsx` |
| `my-passes-page.tsx` | `/app/dashboard/student/my-passes/page.tsx` |
| `my-conduct-page.tsx` | `/app/dashboard/student/my-conduct/page.tsx` |
| `step-1-profile-page.tsx` | `/app/dashboard/student/onboarding/step-1-profile/page.tsx` |
| `step-4-conduct-page.tsx` | `/app/dashboard/student/onboarding/step-4-conduct/page.tsx` |

#### Remaining onboarding stubs to create:

```tsx
// /app/dashboard/student/onboarding/step-2-application/page.tsx
// Pattern: same as step-1 but renders ApplicationForm component
// Uses: submitApplication() from lib/actions/applications.ts

// /app/dashboard/student/onboarding/step-3-documents/page.tsx
// Pattern: Supabase Storage upload for id_copy and proof_of_registration
// Uses: supabase.storage.from('applications-docs').upload(...)

// /app/dashboard/student/my-biometrics/page.tsx
// Pattern: read-only, query biometric_registrations for student_id = session.user.id
```

---

### Components

| Source File | Destination Path |
|---|---|
| `AdminSidebar.tsx` | `/components/layout/AdminSidebar.tsx` |
| `StudentSidebar.tsx` | `/components/layout/StudentSidebar.tsx` |
| `Topbar.tsx` | `/components/layout/Topbar.tsx` |
| `KPIGrid.tsx` | `/components/dashboard/KPIGrid.tsx` |
| `BiometricsTable.tsx` | `/components/biometrics-hub/BiometricsTable.tsx` |
| `TransitLogForm.tsx` | `/components/pass-tracker/TransitLogForm.tsx` |
| `LiveManifestTable.tsx` | `/components/pass-tracker/LiveManifestTable.tsx` |
| `InspectionWizard.tsx` | `/components/move-out-audit/InspectionWizard.tsx` |
| `InspectionReportPDFButton.tsx` | `/components/move-out-audit/InspectionReportPDFButton.tsx` |
| `InspectionPDFDocument.tsx` | `/components/move-out-audit/InspectionPDFDocument.tsx` |
| `ApplicationsQueue.tsx` | `/components/applications/ApplicationsQueue.tsx` |
| `RoomGrid.tsx` | `/components/room-management/RoomGrid.tsx` |
| `ConductAckForm.tsx` | `/components/student/ConductAckForm.tsx` |
| `Step1ProfileForm.tsx` | `/components/student/Step1ProfileForm.tsx` |
| `toaster.tsx` | `/components/ui/toaster.tsx` *(also exports `useToast`)* |

---

### Server Actions

| Source File | Destination Path |
|---|---|
| `biometrics-actions.ts` | `/lib/actions/biometrics.ts` |
| `pass-tracker-actions.ts` | `/lib/actions/pass-tracker.ts` |
| `inspection-actions.ts` | `/lib/actions/inspection.ts` |
| `applications-actions.ts` | `/lib/actions/applications.ts` |
| `room-management-actions.ts` | `/lib/actions/room-management.ts` |
| `conduct-actions.ts` | `/lib/actions/conduct.ts` |
| `profile-actions.ts` | `/lib/actions/profile.ts` |

---

### Supabase Client Helpers
*(code provided in architecture doc Part 5)*

| File | Destination Path |
|---|---|
| Server client | `/lib/supabase/server.ts` |
| Browser client | `/lib/supabase/client.ts` |
| Middleware client | `/lib/supabase/middleware-client.ts` |

---

### API Routes

| Source File | Destination Path |
|---|---|
| `inspection-report-api-route.ts` | `/app/api/inspection-report/[reportId]/route.ts` |

---

### Migrations (run in order)

| File | Location |
|---|---|
| Architecture doc Migrations 0001–0012 | Supabase SQL Editor |
| `migration-0013-rpc.sql` | Supabase SQL Editor (after 0012) |

---

## DEPLOYMENT CHECKLIST

### Phase 1 — Environment Setup
```bash
# 1. Clone / init project
npx create-next-app@latest corridor-hill \
  --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*"
cd corridor-hill

# 2. Install dependencies
npm install @supabase/supabase-js @supabase/ssr @react-pdf/renderer

# 3. Copy all files from generated set to their destination paths

# 4. Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_PROJECT_REF=your-project-ref
EOF
```

### Phase 2 — Database Setup
```sql
-- In Supabase SQL Editor, run migrations 0001 through 0013 in sequence
-- Verify with:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- biometric_audit_log, biometric_registrations, blocks, boundary_transits,
-- conduct_acknowledgements, inspection_line_items, inspection_reports,
-- inspection_template_items, inspection_templates, leases, offence_definitions,
-- offences_log, profiles, rooms, units
```

### Phase 3 — Supabase Configuration
```
Dashboard → Auth → Hooks → on_auth_user_created → handle_new_user (PostgreSQL Function)
Dashboard → Storage → Create buckets: applications-docs, inspection-photos, 
                      inspection-reports, conduct-signatures, avatars
Dashboard → Authentication → Providers → Email → Enable
Dashboard → Authentication → URL Configuration → Redirect URLs → add https://yourdomain.com/auth/callback
```

### Phase 4 — Seed Data
```bash
# Run seed SQL from architecture doc Part 7 to populate blocks, units, rooms
# Then create first admin user:
```
```sql
-- After first admin signs up through /auth/register:
UPDATE profiles SET role = 'admin' WHERE email = 'admin@corridorhill.co.za';
```

### Phase 5 — Generate Types
```bash
npx supabase gen types typescript \
  --project-id $SUPABASE_PROJECT_REF \
  > lib/types/database.types.ts
```

### Phase 6 — Local Development
```bash
npm run dev
# Visit http://localhost:3000
# Admin: http://localhost:3000/dashboard/admin/overview
# Student: http://localhost:3000/dashboard/student/home
```

### Phase 7 — Production Deploy (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

---

## OUTSTANDING STUBS TO COMPLETE

These three pages follow an identical pattern to the generated ones but were not
included to avoid repetition. Each takes less than 30 minutes to complete:

### 1. Step 2 Application Form (`step-2-application`)
- Conditionally renders first-year vs senior fields based on `profile.student_year_type`
- First-year fields: Sport, Cultural, Leadership, Medical, Disability
- Senior field: Current academic average (numeric input 0–100)
- Calls `submitApplication()` from `lib/actions/applications.ts`
- On success: `router.push('/dashboard/student/onboarding/step-3-documents')`

### 2. Step 3 Document Upload (`step-3-documents`)
- Two upload slots: Proof of Registration + ID Copy
- Use `supabase.storage.from('applications-docs').upload(path, file)`
- After upload, call `supabase.from('applications').update({ proof_of_registration_url, id_copy_url })`
- File path pattern: `${studentId}/proof-of-reg-${Date.now()}.pdf`
- On success: `router.push('/dashboard/student/onboarding/step-4-conduct')`

### 3. My Biometrics (`my-biometrics`)
- Query `biometric_registrations` for `student_id = session.user.id`
- Read-only display: registered status, device, sync status, registered date
- Message if not registered: "Visit reception to complete biometric registration"

---

## SYSTEM ARCHITECTURE SUMMARY

```
Next.js 14 App Router
├── Server Components (data fetching, layout)
│   └── createClient() from @supabase/ssr [cookies]
├── Client Components (interactivity, forms)
│   └── createBrowserClient() from @supabase/ssr
├── Server Actions ('use server')
│   └── Authenticated Supabase mutations + revalidatePath()
├── middleware.ts
│   └── RBAC enforcement: /dashboard/admin/* and /dashboard/student/*
│   └── Role fetched from profiles table on every request
└── API Routes
    └── /api/inspection-report/[reportId] → PDF data endpoint

Supabase
├── Auth (email + magic link)
├── PostgreSQL (15 tables, 3 views, 8 triggers, 1 RPC)
│   └── Row Level Security on every table
│   └── Trigger: 3-concurrent-offences auto-escalation
│   └── Trigger: rooms.is_available auto-sync
│   └── Trigger: biometric_audit_log auto-write
│   └── View: active_passes (live manifest)
│   └── View: student_discipline_summary
└── Storage (5 buckets, all private except avatars)

PDF Generation
└── @react-pdf/renderer (client-side, dynamic import)
    └── InspectionPDFDocument → A4 compliance report
    └── Triggered by InspectionReportPDFButton
    └── Data fetched from /api/inspection-report/[reportId]
```

---

## RBAC ENFORCEMENT MODEL

```
                    Request
                       │
              ┌────────▼────────┐
              │  middleware.ts  │  ← Route guard (UX layer)
              │  checks role    │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Server Action  │  ← Permission check (logic layer)
              │  checks role    │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Supabase RLS   │  ← Database enforcement (data layer)
              │  policies       │
              └─────────────────┘

No admin operation can succeed unless it passes all three layers.
Students cannot read other students' data even if they call the API directly.
```

---

## CORRIDOR HILL MODULE STATUS

| Module | Schema | Server Actions | Page | Components |
|---|:---:|:---:|:---:|:---:|
| Biometrics Hub | ✅ | ✅ | ✅ | ✅ |
| Pass Tracker | ✅ | ✅ | ✅ | ✅ |
| Move-Out Audit | ✅ | ✅ | ✅ | ✅ |
| PDF Report Generation | — | — | ✅ | ✅ |
| Applications Queue | ✅ | ✅ | ✅ | ✅ |
| Room Management | ✅ | ✅ | ✅ | ✅ |
| Disciplinary Matrix | ✅ | ✅ | ✅ | ✅ |
| Offence Log Form | ✅ | ✅ | ✅ | ✅ |
| Student Onboarding | ✅ | ✅ | ✅ (1,4) | ✅ |
| Conduct Acknowledgement | ✅ | ✅ | ✅ | ✅ |
| Student Dashboard | ✅ | — | ✅ | ✅ |
| Auth (Login/Register) | — | — | ✅ | ✅ |
| RBAC Middleware | — | — | ✅ | — |

*Steps 2 & 3 of onboarding are stubs (see Outstanding Stubs above)*

---

*Corridor Hill Residence Management Platform · eMalahleni*
*Generated: June 2026 · Next.js 14 App Router · Supabase PostgreSQL*
