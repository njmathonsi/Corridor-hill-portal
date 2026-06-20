// components/move-out-audit/InspectionPDFDocument.tsx
// @ts-nocheck
import {
  Document, Page, Text, View, StyleSheet, Font
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: '32 40',
    color: '#18181b',
    backgroundColor: '#ffffff',
  },
  // Header
  logoText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  reportMeta: {
    fontSize: 8,
    color: '#71717a',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Courier',
  },
  divider: { height: 1, backgroundColor: '#e4e4e7', marginBottom: 12 },

  // Two-col summary
  row2: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryBox: {
    flex: 1, border: '1 solid #e4e4e7', borderRadius: 4,
    padding: 10, backgroundColor: '#fafafa',
  },
  summaryLabel: { fontSize: 7, color: '#71717a', fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderBottom: '1 solid #f4f4f5', paddingVertical: 3, fontSize: 8,
  },
  infoKey: { color: '#71717a' },
  infoVal: { color: '#18181b', fontFamily: 'Helvetica-Bold', fontFamily: 'Courier', fontSize: 8 },

  // Score
  scoreBox: {
    border: '1 solid #e4e4e7', borderRadius: 4, padding: 12,
    alignItems: 'center', backgroundColor: '#fafafa', marginBottom: 12,
  },
  scoreBig: { fontSize: 36, fontFamily: 'Helvetica-Bold' },
  scoreLabel: { fontSize: 8, color: '#71717a', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 },

  // Damage
  damageBox: {
    border: '1 solid #fca5a5', borderRadius: 4,
    backgroundColor: '#fff1f2', padding: 10, marginBottom: 12,
  },
  damageTitle: { fontSize: 9, color: '#f43f5e', fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  damageRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderBottom: '1 solid #fecdd3', paddingVertical: 3, fontSize: 8,
  },
  damageTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 6, fontSize: 10, fontFamily: 'Helvetica-Bold',
  },

  // Checklist
  catHeader: {
    fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8,
    textTransform: 'uppercase', color: '#71717a',
    borderBottom: '1 solid #e4e4e7', paddingBottom: 4,
    marginBottom: 6, marginTop: 10,
  },
  checkRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 4, borderBottom: '1 solid #f4f4f5', fontSize: 8,
  },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, fontSize: 7, fontFamily: 'Helvetica-Bold' },

  // Signatures
  sigRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  sigBox: { flex: 1, borderTop: '1 solid #e4e4e7', paddingTop: 8 },
  sigName: { fontSize: 11, fontFamily: 'Helvetica-Oblique', marginBottom: 4, color: '#18181b' },
  sigLabel: { fontSize: 7, color: '#71717a', letterSpacing: 0.6, textTransform: 'uppercase' },

  footer: { fontSize: 7, color: '#a1a1aa', textAlign: 'center', marginTop: 20, fontFamily: 'Courier' },
})

function conditionColor(c: string) {
  if (c === 'OK_Out') return '#10b981'
  if (c === 'OK_In')  return '#3b82f6'
  return '#f43f5e'
}

function conditionBg(c: string) {
  if (c === 'OK_Out') return '#ecfdf5'
  if (c === 'OK_In')  return '#eff6ff'
  return '#fff1f2'
}

interface ReportData {
  report_ref: string
  inspection_date: string
  inspector_name: string
  total_damage_cost: number
  recommended_deduction: number
  notes: string
  student_signature: string
  inspection_line_items: {
    item_name: string
    category: string
    condition_out: string
    problem_description: string
    repair_cost_estimate: number
  }[]
  rooms: { room_number: string; units: { unit_code: string; blocks: { code: string } } }
  profiles: { full_name: string; student_number: string; course: string; faculty: string }
}

export function InspectionPDFDocument({ report }: { report: ReportData }) {
  const items = report.inspection_line_items ?? []
  const damaged = items.filter(i => i.condition_out === 'Not_OK')
  const okCount = items.filter(i => i.condition_out !== 'Not_OK').length
  const score   = items.length > 0 ? Math.round((okCount / items.length) * 100) : 100
  const categories = [...new Set(items.map(i => i.category))]
  const block = report.rooms?.units?.blocks?.code ?? '—'
  const unit  = report.rooms?.units?.unit_code ?? ''

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.logoText}>◆ CORRIDOR HILL RESIDENCE · EMALAHLENI</Text>
        <Text style={styles.reportTitle}>Move-Out Inspection Report</Text>
        <Text style={styles.reportMeta}>
          REF: {report.report_ref} · {new Date(report.inspection_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}
        </Text>
        <View style={styles.divider} />

        {/* Score + summary */}
        <View style={styles.row2}>
          <View style={{ ...styles.summaryBox, alignItems: 'center', flex: 0.6 }}>
            <Text style={{ ...styles.scoreBig, color: score > 80 ? '#10b981' : score > 50 ? '#f59e0b' : '#f43f5e' }}>
              {score}%
            </Text>
            <Text style={styles.scoreLabel}>Room Condition</Text>
            <Text style={{ fontSize: 8, color: '#71717a', marginTop: 2 }}>{okCount}/{items.length} Items OK</Text>
            {report.total_damage_cost > 0 && (
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#f59e0b', marginTop: 8 }}>
                R {Number(report.total_damage_cost).toFixed(2)} damage
              </Text>
            )}
          </View>
          <View style={{ ...styles.summaryBox, flex: 1 }}>
            <Text style={styles.summaryLabel}>Report Details</Text>
            {[
              ['Location', `Block ${block} · ${block}${unit} · ${report.rooms?.room_number}`],
              ['Student', report.profiles?.full_name ?? '—'],
              ['Student No.', report.profiles?.student_number ?? '—'],
              ['Faculty', report.profiles?.faculty ?? '—'],
              ['Inspector', report.inspector_name],
              ['Date', new Date(report.inspection_date).toLocaleDateString('en-ZA')],
            ].map(([k, v]) => (
              <View key={k} style={styles.infoRow}>
                <Text style={styles.infoKey}>{k}</Text>
                <Text style={styles.infoVal}>{String(v)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Damage summary */}
        {damaged.length > 0 && (
          <View style={styles.damageBox}>
            <Text style={styles.damageTitle}>⚠ Damage Found — {damaged.length} Item{damaged.length > 1 ? 's' : ''}</Text>
            {damaged.map((item, idx) => (
              <View key={idx} style={styles.damageRow}>
                <View>
                  <Text style={{ fontFamily: 'Helvetica-Bold', color: '#18181b' }}>{item.item_name}</Text>
                  {item.problem_description && (
                    <Text style={{ color: '#71717a', marginTop: 1 }}>{item.problem_description}</Text>
                  )}
                </View>
                <Text style={{ color: '#f59e0b', fontFamily: 'Helvetica-Bold' }}>
                  R {Number(item.repair_cost_estimate ?? 0).toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={styles.damageTotal}>
              <Text>Total Damage</Text>
              <Text style={{ color: '#f59e0b' }}>R {Number(report.total_damage_cost).toFixed(2)}</Text>
            </View>
            {Number(report.recommended_deduction) > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, paddingTop: 4 }}>
                <Text style={{ color: '#71717a' }}>Recommended Deposit Deduction</Text>
                <Text style={{ color: '#f43f5e', fontFamily: 'Helvetica-Bold' }}>R {Number(report.recommended_deduction).toFixed(2)}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* Checklist */}
        {categories.map(cat => (
          <View key={cat}>
            <Text style={styles.catHeader}>{cat}</Text>
            {items.filter(i => i.category === cat).map((item, idx) => (
              <View key={idx} style={styles.checkRow}>
                <Text style={{ color: '#18181b' }}>{item.item_name}</Text>
                <View style={{ ...styles.badge, backgroundColor: conditionBg(item.condition_out) }}>
                  <Text style={{ color: conditionColor(item.condition_out) }}>
                    {item.condition_out.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Notes */}
        {report.notes && (
          <View style={{ marginTop: 12, border: '1 solid #e4e4e7', borderRadius: 4, padding: 8, backgroundColor: '#fafafa' }}>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#71717a', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Inspector Notes</Text>
            <Text style={{ fontSize: 8, color: '#52525b', lineHeight: 1.4 }}>{report.notes}</Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.sigRow}>
          <View style={styles.sigBox}>
            <Text style={styles.sigName}>{report.inspector_name}</Text>
            <Text style={styles.sigLabel}>Inspector Signature</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigName}>{report.student_signature ?? '—'}</Text>
            <Text style={styles.sigLabel}>Student Signature</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Corridor Hill Residence Management System · {report.report_ref} · Generated {new Date().toLocaleString('en-ZA')}
        </Text>
      </Page>
    </Document>
  )
}
