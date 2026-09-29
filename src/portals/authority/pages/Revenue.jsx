import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import { TrendChart, DonutChart, Legend2, BarsChart } from '../../../components/domain/Charts.jsx'
import useAuthority from '../useAuthority.js'
import { MMK, dt, num } from '../../../lib/format.js'
import { Banknote, EyeOff } from 'lucide-react'
export default function Revenue() {
  const { db } = useAuthority()
  const trend = db.salesDaily.map((d) => ({
    date: d.date.slice(5),
    gross: d.gross,
    levy: d.levy,
    platformFee: d.platformFee,
  }))
  const today = db.salesDaily[db.salesDaily.length - 1]
  const licenceFees = db.invoices
    .filter((i) => i.kind === 'licence' && i.status === 'paid')
    .reduce((s, i) => s + i.amount, 0)
  const fines = db.invoices.filter((i) => i.kind === 'fine' && i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const monthLevy = db.salesDaily.reduce((s, d) => s + d.levy, 0)
  const mix = [
    { name: 'Government levy', value: monthLevy, color: '#38663b' },
    { name: 'Licence fees', value: licenceFees, color: '#6a9d6c' },
    { name: 'Fines', value: fines, color: '#d97706' },
  ]
  const byClass = ['BRT', 'Trunk', 'Feeder', 'Intercity'].map((cls) => ({
    name: cls,
    value: Math.round(monthLevy * (cls === 'BRT' ? 0.38 : cls === 'Trunk' ? 0.31 : cls === 'Feeder' ? 0.11 : 0.2)),
  }))
  const invoiceRows = db.invoices.map((i) => ({
    ...i,
    kindLabel: i.kind === 'licence' ? 'Licence fee' : 'Fine',
  }))
  return (
    <>
      <PageHeader
        title="Regulated revenue"
        subtitle="Ticket gross sold through the platform, government levy, licence fees and fines by region, route class and period. Operator internal costs are never shown."
        meta={
          <Badge tone="slate" icon={EyeOff}>
            Regulated money only
          </Badge>
        }
      />

      <StatGrid cols={5} className="mb-5">
        <Stat
          label="Gross ticket sales today"
          value={MMK(today.gross)}
          icon={Banknote}
          method="Face value of tickets sold through the platform today. This is not authority income."
        />
        <Stat
          label="Government levy (14 days)"
          value={MMK(monthLevy)}
          tone="good"
          method="Levy collected on platform ticket sales at the rate in the split rules."
        />
        <Stat
          label="Licence fees collected"
          value={MMK(licenceFees)}
          method="Paid licence invoices posted to the treasury account."
        />
        <Stat
          label="Fines collected"
          value={MMK(fines)}
          method="Sanctions from upheld findings, invoiced and settled."
        />
        <Stat
          label="Reconciled daily"
          value="100%"
          tone="good"
          method="Three-way reconciliation between payment provider, ledger and bank. The published target."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Platform sales and levy" subtitle="Last 14 days" />
          <CardBody>
            <TrendChart
              data={trend}
              height={240}
              series={[
                { key: 'gross', label: 'Gross sales' },
                { key: 'levy', label: 'Government levy' },
              ]}
              format={(v) => `${Math.round(v / 1e6)}M`}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Where regulated revenue comes from" />
          <CardBody>
            <DonutChart
              data={mix}
              format={MMK}
              center={{ value: MMK(monthLevy + licenceFees + fines).replace(' MMK', ''), label: 'MMK total' }}
            />
            <Legend2 items={mix} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Levy by route class" subtitle="Split rules are configurable per class and region" />
          <CardBody>
            <BarsChart
              data={byClass}
              x="name"
              height={210}
              series={[{ key: 'value', label: 'Levy MMK' }]}
              format={(v) => `${Math.round(v / 1000)}k`}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Split rules in force" />
          <CardBody className="space-y-2">
            {db.splitRules.map((r) => (
              <div key={r.scope} className="rounded-lg border border-ink-200 p-3">
                <p className="text-[12.5px] font-medium text-ink-900">{r.scope}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge tone="green">Operator {r.poShare}%</Badge>
                  <Badge tone="brand">Platform {r.platformFee}%</Badge>
                  <Badge tone="blue">Levy {r.levy}%</Badge>
                  <Badge tone="amber">Payment {r.paymentFee}%</Badge>
                </div>
              </div>
            ))}
            <p className="text-[11.5px] text-ink-400 leading-relaxed pt-1">
              Platform fee, levy and ad revenue split are still open commercial questions (Q4) — the figures here are
              configurable placeholders.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Government billing"
          subtitle="Licence fee and fine invoices with numbered, digitally signed e-receipts posted to the treasury account"
        />
        <CardBody className="p-0">
          <DataTable
            columns={[
              { key: 'id', header: 'Invoice', render: (r) => <span className="font-mono text-[12.5px]">{r.id}</span> },
              { key: 'kindLabel', header: 'Kind' },
              { key: 'partyName', header: 'Party' },
              { key: 'ref', header: 'Reference' },
              { key: 'amount', header: 'Amount', align: 'right', render: (r) => MMK(r.amount) },
              { key: 'issuedAt', header: 'Issued', render: (r) => dt(r.issuedAt) },
              { key: 'receiptNo', header: 'e-Receipt', render: (r) => r.receiptNo || '—' },
              {
                key: 'treasuryPosted',
                header: 'Treasury',
                render: (r) =>
                  r.treasuryPosted ? <Badge tone="green">Posted</Badge> : <Badge tone="amber">Pending</Badge>,
              },
              { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
            ]}
            rows={invoiceRows}
            exportName="regulated-revenue"
            searchKeys={['id', 'partyName', 'ref']}
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'paid', label: 'Paid' },
                  { value: 'unpaid', label: 'Unpaid' },
                ],
              },
            ]}
          />
        </CardBody>
      </Card>

      <p className="text-[12px] text-ink-400 mt-3">
        Total tickets today {num(today.tickets)}. The authority sees regulated money only — never an operator's internal
        costs, and never a passenger's identity.
      </p>
    </>
  )
}
