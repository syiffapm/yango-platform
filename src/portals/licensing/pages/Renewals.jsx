import { Stamp } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dateOnly, daysUntil } from '../../../lib/format.js'
import { licenceTypes } from '../../../data/org.js'
export default function Renewals() {
  const { db, update, notify } = useDb()
  const [ses] = useSession('licensing')
  const toast = useToast()
  const rows = db.permits
    .filter((p) => p.holder === ses.operator || p.operator === ses.operator)
    .map((p) => ({
      ...p,
      days: daysUntil(p.expiry),
      typeLabel: licenceTypes.find((t) => t.code === p.type)?.label || p.type,
    }))
    .filter((p) => p.days <= 180)
    .sort((a, b) => a.days - b.days)
  const penalty = (days) => (days < 0 ? Math.round(Math.abs(days) * 5000) : 0)
  const startRenewal = (p) => {
    const lt = licenceTypes.find((t) => t.code === p.type)
    const id = `APP-2026-${1200 + db.applications.length}`
    const invoiceId = `INV-L-${5400 + db.applications.length}`
    const fee = lt.fee + penalty(p.days)
    update((d) => {
      d.applications.unshift({
        id,
        type: p.type,
        typeLabel: `${lt.label} (renewal)`,
        operator: ses.operator,
        applicantName: p.holderName,
        quantity: 1,
        note: `Renewal of ${p.id}, pre-filled from the current permit`,
        state: 'awaiting_payment',
        officer: null,
        approver: null,
        submittedAt: new Date().toISOString(),
        slaDueAt: new Date(Date.now() + 5 * 86400000).toISOString(),
        fee,
        paid: false,
        invoiceId,
        documents: lt.docs.map((name) => ({
          name,
          status: 'verified',
          uploadedAt: new Date().toISOString(),
          ocr: { expiry: '2028-01-31' },
          size: 're-used',
        })),
        checklist: lt.docs.map((name) => ({ item: `Verify ${name.toLowerCase()}`, result: null, comment: '' })),
        inspection: null,
        registryChecks: [
          { registry: 'Company registry', result: 'match', ref: 'DICA-OK' },
          { registry: 'Duplicate detection', result: 'clear', ref: '—' },
        ],
        decision: null,
        timeline: [
          { at: new Date().toISOString(), actor: 'Applicant', action: 'Renewal started with pre-filled data' },
        ],
      })
      d.invoices.unshift({
        id: invoiceId,
        kind: 'licence',
        party: ses.operator,
        partyName: p.holderName,
        amount: fee,
        issuedAt: new Date().toISOString(),
        status: 'unpaid',
        ref: id,
        method: null,
        receiptNo: null,
        treasuryPosted: false,
      })
    })
    notify({ audience: 'authority', title: 'Renewal filed', body: `${p.holderName} started a renewal of ${p.id}.` })
    toast({
      title: 'Renewal started',
      body: penalty(p.days)
        ? `Late-renewal penalty of ${MMK(penalty(p.days))} added.`
        : 'Data pre-filled from the current permit.',
    })
  }
  return (
    <>
      <PageHeader
        title="Renewals"
        subtitle="Renewal pre-fills from the current permit. Reminders go out at 90, 60, 30 and 7 days; a late-renewal penalty is calculated automatically."
        meta={
          <Badge tone="amber" icon={Stamp}>
            {rows.filter((r) => r.days <= 90).length} due within 90 days
          </Badge>
        }
      />
      <DataTable
        columns={[
          { key: 'id', header: 'Permit', render: (r) => <span className="font-mono text-[12.5px]">{r.id}</span> },
          { key: 'typeLabel', header: 'Type' },
          { key: 'holderName', header: 'Holder' },
          { key: 'expiry', header: 'Expires', render: (r) => dateOnly(r.expiry) },
          {
            key: 'days',
            header: 'Days left',
            align: 'right',
            render: (r) => (
              <Badge tone={r.days < 0 ? 'red' : r.days <= 30 ? 'amber' : r.days <= 90 ? 'blue' : 'slate'}>
                {r.days}
              </Badge>
            ),
          },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          {
            key: '_p',
            header: 'Late penalty',
            align: 'right',
            sortable: false,
            render: (r) => (penalty(r.days) ? MMK(penalty(r.days)) : '—'),
          },
          {
            key: '_a',
            header: '',
            sortable: false,
            align: 'right',
            render: (r) => (
              <Button size="xs" variant="primary" onClick={() => startRenewal(r)}>
                Renew
              </Button>
            ),
          },
        ]}
        rows={rows}
        exportName="renewals"
        empty="Nothing due for renewal in the next 180 days"
      />
    </>
  )
}
