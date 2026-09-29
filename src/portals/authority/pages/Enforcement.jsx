import { useState } from 'react'
import { Gavel, Plus, Siren } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import useAuthority from '../useAuthority.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dt } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
export default function Enforcement() {
  const { db, update, audit, me } = useAuthority()
  const toast = useToast()
  const [tab, setTab] = useState('ramp')
  const ramps = db.applications
    .filter((a) => a.inspection)
    .map((a) => ({
      id: a.id,
      when: a.inspection.scheduledAt,
      inspector: db.users.find((u) => u.id === a.inspection.inspector)?.name,
      location: a.inspection.location,
      subject: a.applicantName,
      result: a.inspection.result || 'pending',
    }))
  const fines = db.invoices
    .filter((i) => i.kind === 'fine')
    .map((i) => ({
      ...i,
      finding: i.ref,
    }))
  const sanctions = db.findings
    .filter((f) => f.sanction)
    .map((f) => ({
      id: f.id,
      operator: (db.operators || []).find((o) => o.id === f.operator)?.name,
      line: routes.find((r) => r.id === f.route)?.line,
      type: f.sanction.type,
      amount: f.sanction.amount,
      status: f.sanction.status,
      at: f.ruling?.at,
    }))
  const issueEfine = () => {
    const id = `INV-F-${9200 + db.invoices.length}`
    update((d) => {
      d.invoices.unshift({
        id,
        kind: 'fine',
        party: 'PO04',
        partyName: 'Thiri Yadana Bus Line',
        amount: 500000,
        issuedAt: new Date().toISOString(),
        status: 'unpaid',
        ref: 'Roadside inspection',
        method: null,
        receiptNo: null,
        treasuryPosted: false,
      })
    })
    audit({
      actor: me.id,
      role: me.role,
      action: 'Issued e-fine',
      object: id,
      reason: 'Roadside inspection — expired roadworthiness certificate.',
      category: 'Compliance',
    })
    toast({ title: 'e-Fine issued', body: 'Sent to the operator and mirrored to the police e-ticketing system.' })
  }
  return (
    <>
      <PageHeader
        title="Enforcement"
        subtitle="Ramp-check schedules and results, roadside inspections, e-fines and the link to police e-ticketing."
        actions={
          <Button variant="primary" icon={Plus} onClick={issueEfine}>
            Issue e-fine
          </Button>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Ramp checks scheduled"
          value={ramps.filter((r) => r.result === 'pending').length}
          icon={Gavel}
          method="Inspections booked but not yet carried out."
        />
        <Stat
          label="Sanctions active"
          value={sanctions.filter((s) => s.status !== 'paid').length}
          tone="warn"
          method="Warnings, fines and suspensions from upheld findings that are not yet settled."
        />
        <Stat
          label="Fines issued"
          value={MMK(fines.reduce((s, f) => s + f.amount, 0))}
          method="Total value of e-fines raised against operators."
        />
        <Stat
          label="Collected"
          value={MMK(fines.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0))}
          tone="good"
          method="Fines settled and posted to the treasury account."
        />
      </StatGrid>

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { value: 'ramp', label: 'Ramp checks', count: ramps.length },
          { value: 'sanctions', label: 'Sanctions', count: sanctions.length },
          { value: 'fines', label: 'e-Fines', count: fines.length },
        ]}
      />

      {tab === 'ramp' && (
        <DataTable
          columns={[
            { key: 'id', header: 'Reference' },
            { key: 'subject', header: 'Subject' },
            { key: 'when', header: 'Slot', render: (r) => dt(r.when) },
            { key: 'inspector', header: 'Inspector' },
            { key: 'location', header: 'Location' },
            { key: 'result', header: 'Result', render: (r) => <StatusPill status={r.result} /> },
          ]}
          rows={ramps}
          exportName="ramp-checks"
          empty="No ramp checks booked"
        />
      )}

      {tab === 'sanctions' && (
        <DataTable
          columns={[
            { key: 'id', header: 'Finding' },
            { key: 'operator', header: 'Operator' },
            { key: 'line', header: 'Line' },
            {
              key: 'type',
              header: 'Sanction',
              render: (r) => <Badge tone={r.type === 'suspension' ? 'red' : 'amber'}>{r.type}</Badge>,
            },
            { key: 'amount', header: 'Amount', align: 'right', render: (r) => (r.amount ? MMK(r.amount) : '—') },
            { key: 'at', header: 'Ruled', render: (r) => dt(r.at) },
            { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          ]}
          rows={sanctions}
          exportName="sanctions"
          empty="No sanctions in force"
        />
      )}

      {tab === 'fines' && (
        <>
          <DataTable
            columns={[
              { key: 'id', header: 'Invoice', render: (r) => <span className="font-mono text-[12.5px]">{r.id}</span> },
              { key: 'partyName', header: 'Operator' },
              { key: 'finding', header: 'Basis' },
              { key: 'amount', header: 'Amount', align: 'right', render: (r) => MMK(r.amount) },
              { key: 'issuedAt', header: 'Issued', render: (r) => dt(r.issuedAt) },
              { key: 'receiptNo', header: 'e-Receipt', render: (r) => r.receiptNo || '—' },
              { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
            ]}
            rows={fines}
            exportName="e-fines"
            empty="No fines issued"
          />
          <Card className="mt-4">
            <CardHeader
              title="Police e-ticketing link"
              subtitle="Violations and fines exchanged with the traffic police system"
              icon={Siren}
            />
            <CardBody>
              <Badge tone="violet">Sandbox mode — no live exchange until the data-sharing agreement is signed</Badge>
              <p className="text-[12.5px] text-ink-500 mt-2 leading-relaxed">
                Roadside inspection devices post their result into this queue. Where a violation carries a statutory
                penalty, the e-fine is mirrored to the police system and the receipt flows back here.
              </p>
            </CardBody>
          </Card>
        </>
      )}
    </>
  )
}
