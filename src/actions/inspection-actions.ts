'use server'
// lib/actions/inspection.ts
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type Condition = 'OK_In' | 'OK_Out' | 'Not_OK'
type ConditionMap = Record<string, { condition: Condition; problem?: string; cost?: number }>

interface FinaliseInput {
  blockId: number
  unitCode: string
  roomNumber: string
  inspectorName: string
  inspectionDate: string
  studentId?: string
  conditions: ConditionMap
  notes: string
  deduction: number
  studentSignature?: string
}

export async function finaliseInspection(input: FinaliseInput) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  // Verify admin
  const { data: admin } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (admin?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  // Resolve room_id from block + unit + room
  const { data: room } = await supabase
    .from('rooms')
    .select('id, units!inner(unit_code, block_id)')
    .eq('room_number', input.roomNumber)
    .eq('units.block_id', input.blockId)
    .eq('units.unit_code', input.unitCode)
    .single()

  if (!room) return { success: false, error: `Room not found: Block ${input.blockId} Unit ${input.unitCode} ${input.roomNumber}` }

  // Find active lease if student provided
  let leaseId: string | null = null
  if (input.studentId) {
    const { data: lease } = await supabase
      .from('leases')
      .select('id')
      .eq('student_id', input.studentId)
      .eq('room_id', room.id)
      .eq('is_active', true)
      .limit(1)
      .single()
    leaseId = lease?.id ?? null
  }

  // Calculate totals
  const totalDamage = Object.values(input.conditions)
    .filter(v => v.condition === 'Not_OK')
    .reduce((sum, v) => sum + (v.cost ?? 0), 0)

  // 1. Create inspection report
  const { data: report, error: reportError } = await supabase
    .from('inspection_reports')
    .insert({
      lease_id:             leaseId,
      student_id:           input.studentId ?? null,
      room_id:              room.id,
      template_id:          1, // Standard Room Audit
      inspection_type:      'move_out',
      inspection_date:      input.inspectionDate,
      inspector_name:       input.inspectorName,
      inspector_user_id:    session.user.id,
      total_damage_cost:    totalDamage,
      recommended_deduction: input.deduction,
      student_signature:    input.studentSignature ?? null,
      inspector_signature:  session.user.id,
      signed_at:            new Date().toISOString(),
      is_finalised:         true,
      finalised_at:         new Date().toISOString(),
      notes:                input.notes,
    })
    .select('id, report_ref')
    .single()

  if (reportError) return { success: false, error: reportError.message }

  // 2. Insert line items for every assessed item
  const ITEM_NAMES: Record<string, { name: string; category: string }> = {
    main_door_handle:   { name: 'Main Door Handle',    category: 'Entry' },
    door_frame:         { name: 'Door Frame',          category: 'Entry' },
    door_lock:          { name: 'Door Lock / Key',     category: 'Entry' },
    bed_base:           { name: 'Bed Base',            category: 'Bedroom' },
    mattress:           { name: 'Mattress',            category: 'Bedroom' },
    pillow:             { name: 'Pillow',              category: 'Bedroom' },
    study_desk:         { name: 'Study Desk',          category: 'Bedroom' },
    study_chair:        { name: 'Study Chair',         category: 'Bedroom' },
    wardrobe:           { name: 'Wardrobe',            category: 'Bedroom' },
    wardrobe_key:       { name: 'Wardrobe Key',        category: 'Bedroom' },
    blinds:             { name: 'Blinds / Curtains',   category: 'Bedroom' },
    walls:              { name: 'Walls',               category: 'Bedroom' },
    ceiling:            { name: 'Ceiling',             category: 'Bedroom' },
    flooring:           { name: 'Flooring',            category: 'Bedroom' },
    basin:              { name: 'Bathroom Basin',      category: 'Bathroom' },
    basin_taps:         { name: 'Taps (Basin)',        category: 'Bathroom' },
    shower_head:        { name: 'Shower Head',         category: 'Bathroom' },
    shower_tray:        { name: 'Shower Tray',         category: 'Bathroom' },
    shower_taps:        { name: 'Taps (Shower)',       category: 'Bathroom' },
    toilet_bowl:        { name: 'Toilet Bowl',         category: 'Bathroom' },
    toilet_seat:        { name: 'Toilet Seat',         category: 'Bathroom' },
    toilet_flush:       { name: 'Toilet Flush Handle', category: 'Bathroom' },
    towel_rail:         { name: 'Towel Rail',          category: 'Bathroom' },
    soap_holder:        { name: 'Soap Holder',         category: 'Bathroom' },
    mirror:             { name: 'Mirror',              category: 'Bathroom' },
    tiles:              { name: 'Tiles',               category: 'Bathroom' },
    window_frame:       { name: 'Window Frame',        category: 'Windows' },
    window_glass:       { name: 'Window Glass',        category: 'Windows' },
    facia_board:        { name: 'Facia Board',         category: 'Windows' },
    light_fittings:     { name: 'Light Fittings',      category: 'Fixtures' },
    electrical_outlets: { name: 'Electrical Outlets',  category: 'Fixtures' },
  }

  const lineItems = Object.entries(input.conditions).map(([key, val]) => ({
    report_id:           report!.id,
    item_name:           ITEM_NAMES[key]?.name ?? key,
    category:            ITEM_NAMES[key]?.category ?? 'Other',
    condition_out:       val.condition,
    problem_description: val.problem ?? null,
    repair_cost_estimate: val.cost ?? 0,
  }))

  if (lineItems.length > 0) {
    const { error: itemsError } = await supabase
      .from('inspection_line_items')
      .insert(lineItems)

    if (itemsError) return { success: false, error: itemsError.message }
  }

  revalidatePath('/dashboard/admin/move-out-audit')
  return {
    success: true,
    reportId: report!.id,
    ref: report!.report_ref,
  }
}

// ── Log offence against a student ──────────────────────────────
export async function logOffence(input: {
  studentId: string
  offenceDefinitionId: number
  incidentDate: string
  description: string
  location?: string
  appliedOutcome: string
  fineAmount: number
  damageCostRecovery?: number
  itemDamaged?: string
  itemConfiscated?: string
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (admin?.role !== 'admin') return { success: false, error: 'Insufficient permissions' }

  // Count previous offences of this type for this student
  const { count: prevCount } = await supabase
    .from('offences_log')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', input.studentId)
    .eq('offence_definition_id', input.offenceDefinitionId)

  const { error } = await supabase.from('offences_log').insert({
    student_id:           input.studentId,
    offence_definition_id: input.offenceDefinitionId,
    incident_date:        input.incidentDate,
    incident_description: input.description,
    location:             input.location ?? null,
    offence_count_at_time: (prevCount ?? 0) + 1,
    applied_outcome:      input.appliedOutcome,
    fine_amount_applied:  input.fineAmount,
    damage_cost_recovery: input.damageCostRecovery ?? 0,
    item_damaged:         input.itemDamaged ?? null,
    item_confiscated:     input.itemConfiscated ?? null,
    logged_by:            session.user.id,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/admin/disciplinary')
  return { success: true }
}
