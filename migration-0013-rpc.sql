-- Migration 0013 — Offence Count Helper RPC
-- Returns per-student, per-offence-definition offence counts
-- Used by the Log Offence form to auto-calculate escalation tier

CREATE OR REPLACE FUNCTION get_offence_counts_per_student()
RETURNS TABLE (
  student_id            UUID,
  offence_definition_id INTEGER,
  count                 BIGINT
) AS $$
  SELECT
    student_id,
    offence_definition_id,
    COUNT(*) AS count
  FROM offences_log
  GROUP BY student_id, offence_definition_id
$$ LANGUAGE SQL SECURITY DEFINER;
