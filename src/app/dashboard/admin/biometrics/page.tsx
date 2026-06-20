// app/dashboard/admin/biometrics-hub/page.tsx
import { createClient } from '@/lib/supabase/server'
import BiometricsTable from '@/components/biometrics-hub/BiometricsTable'

export const revalidate = 0 // always fresh

export default async function BiometricsHubPage() {
  const supabase = createClient()

  const { data: registrations } = await supabase
    .from('biometric_registrations')
    .select(`
      id,
      biometric_registered,
      registered_at,
      deregistered_at,
      device_id,
      device_label,
      device_type,
      sync_status,
      last_synced_at,
      notes,
      profiles!biometric_registrations_student_id_fkey (
        id, full_name, student_number, email
      )
    `)
    .order('sync_status', { ascending: true }) // pending first

  // Students with no biometric record at all
  const { data: allStudents } = await supabase
    .from('profiles')
    .select('id, full_name, student_number, email')
    .eq('role', 'student')
    .order('full_name')

  const registeredIds = new Set((registrations ?? []).map((r: any) => r.profiles?.id))
  const unregistered = (allStudents ?? []).filter(s => !registeredIds.has(s.id))

  return (
    <div className="animate-page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Biometrics Hub
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            3D liveness verification · Access gate sync · Device management
          </p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 99,
          fontSize: 11, fontWeight: 600,
          background: 'var(--blue-dim)', color: 'var(--blue)',
          border: '1px solid var(--blue-ring)',
        }}>
          ● Biometric Active
        </span>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          {
            val: (registrations ?? []).filter((r: any) => r.biometric_registered).length,
            label: 'Registered',
            color: 'var(--emerald)',
          },
          {
            val: (registrations ?? []).filter((r: any) => r.sync_status === 'pending').length + unregistered.length,
            label: 'Pending',
            color: 'var(--amber)',
          },
          {
            val: (registrations ?? []).filter((r: any) => r.sync_status === 'failed').length,
            label: 'Sync Failed',
            color: 'var(--rose)',
          },
          {
            val: unregistered.length,
            label: 'Never Registered',
            color: 'var(--text-secondary)',
          },
        ].map(tile => (
          <div key={tile.label} style={{
            flex: 1, background: 'var(--bg-raised)',
            border: '1px solid var(--border-dim)',
            borderRadius: 'var(--r-md)', padding: '10px 14px',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: tile.color }}>
              {tile.val}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {tile.label}
            </div>
          </div>
        ))}
      </div>

      <BiometricsTable
        registrations={registrations ?? []}
        unregisteredStudents={unregistered}
      />
    </div>
  )
}
