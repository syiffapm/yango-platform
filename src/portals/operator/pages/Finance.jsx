import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { TrendChart, DonutChart, Legend2 } from '../../../components/domain/Charts.jsx'
import useOperator from '../useOperator.js'
import { MMK, dateOnly, num } from '../../../lib/format.js'
import { Banknote, Download } from 'lucide-react'
export default function Finance() {
  const { db, settlements, op } = useOperator()
  const share = db.salesDaily.map((d) => ({
    date: d.date.slice(5),
    gross: Math.round(d.gross / 8),
    net: Math.round(d.net / 8),
  }))
  const latest = settlements[0]
  const rule = db.splitRules[0]
  const splitData = latest
    ? [
        { name: 'Your share', value: latest.net, color: '#38663b' },
        { name: 'Platform fee', value: latest.platformFee, color: '#6a9d6c' },
        { name: 'Government levy', value: latest.levy, color: '#0284c7' },
        { name: 'Payment fee', value: latest.paymentFee, color: '#d97706' },
      ]
    : []
  return (
    <>
      <PageHeader
        title="Finance & settlement"
        subtitle="FR-PO-21 / sales by channel, platform fee, government levy, net settlement and payout history. Settlement is T+1, net of fees and levy; disputed amounts are held."
        actions={<Button icon={Download}>Download statement</Button>}
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Gross sales (yesterday)"
          value={MMK(latest?.gross)}
          icon={Banknote}
          method="Face value of tickets sold on your services through the platform."
        />
        <Stat
          label="Net settlement"
          value={MMK(latest?.net)}
          tone="good"
          method="Gross − platform fee − government levy − payment fees, minus any held amount."
        />
        <Stat
          label="Held"
          value={MMK(latest?.held || 0)}
          tone={latest?.held ? 'warn' : 'default'}
          method="Amounts withheld pending a refund dispute or a chargeback."
        />
        <Stat
          label="Effective take rate"
          value={`${rule.poShare}%`}
          method={`Split rule for ${rule.scope}: platform ${rule.platformFee}%, levy ${rule.levy}%, payment ${rule.paymentFee}%.`}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Gross vs net" subtitle="Last 14 days, your share of platform sales" />
          <CardBody>
            <TrendChart
              data={share}
              series={[
                { key: 'gross', label: 'Gross' },
                { key: 'net', label: 'Net to you' },
              ]}
              format={(v) => `${Math.round(v / 1000)}k`}
              height={220}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Where the money goes" subtitle="Yesterday's settlement" />
          <CardBody>
            <DonutChart
              data={splitData}
              format={MMK}
              center={{ value: MMK(latest?.gross).replace(' MMK', ''), label: 'gross MMK' }}
            />
            <Legend2 items={splitData} />
          </CardBody>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader title="Payout history" subtitle={`Paid T+1 to ${op.bank.name} ${op.bank.acc}`} />
        <CardBody className="p-0">
          <DataTable
            search={false}
            columns={[
              { key: 'date', header: 'Service day', render: (r) => dateOnly(r.date) },
              { key: 'gross', header: 'Gross', align: 'right', render: (r) => MMK(r.gross) },
              { key: 'platformFee', header: 'Platform fee', align: 'right', render: (r) => MMK(r.platformFee) },
              { key: 'levy', header: 'Levy', align: 'right', render: (r) => MMK(r.levy) },
              { key: 'paymentFee', header: 'Payment fee', align: 'right', render: (r) => MMK(r.paymentFee) },
              { key: 'held', header: 'Held', align: 'right', render: (r) => (r.held ? MMK(r.held) : '—') },
              {
                key: 'net',
                header: 'Net paid',
                align: 'right',
                render: (r) => <span className="font-medium">{MMK(r.net)}</span>,
              },
              { key: 'ref', header: 'Bank ref' },
              { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
            ]}
            rows={settlements}
            exportName="settlements"
            empty="No settlements yet"
          />
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader
            title="Split rules in force"
            subtitle="Configurable per route class and region by the authority"
          />
          <CardBody className="space-y-2">
            {db.splitRules.map((r) => (
              <div key={r.scope} className="rounded-lg border border-ink-200 p-3">
                <p className="text-[12.5px] font-medium text-ink-900">{r.scope}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge tone="green">PO {r.poShare}%</Badge>
                  <Badge tone="brand">Platform {r.platformFee}%</Badge>
                  <Badge tone="blue">Levy {r.levy}%</Badge>
                  <Badge tone="amber">Payment {r.paymentFee}%</Badge>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Reconciliation" subtitle="Three-way: provider, ledger, bank" />
          <CardBody className="p-0">
            <DataTable
              search={false}
              dense
              columns={[
                { key: 'date', header: 'Date' },
                { key: 'provider', header: 'Provider', align: 'right', render: (r) => num(Math.round(r.provider / 8)) },
                { key: 'ledger', header: 'Ledger', align: 'right', render: (r) => num(Math.round(r.ledger / 8)) },
                { key: 'exceptions', header: 'Exceptions', align: 'right' },
                { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
              ]}
              rows={db.reconciliation}
            />
          </CardBody>
        </Card>
      </div>
    </>
  )
}
