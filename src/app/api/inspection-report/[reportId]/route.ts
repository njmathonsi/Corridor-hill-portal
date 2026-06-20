// app/api/inspection-report/[reportId]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: report, error } = await supabase
    .from('inspection_reports')
    .select(`
      *,
      rooms (
        room_number, monthly_rate,
        units ( unit_code, blocks ( code ) )
      ),
      profiles!inspection_reports_student_id_fkey (
        full_name, student_number, email, course, faculty
      ),
      inspection_line_items (
        item_name, category, condition_out,
        problem_description, repair_cost_estimate, sort_order
      )
    `)
    .eq('id', params.reportId)
    .single()

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  return NextResponse.json(report)
}
