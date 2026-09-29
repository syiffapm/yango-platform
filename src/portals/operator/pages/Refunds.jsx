import { useState } from 'react'
import { Receipt, RotateCcw } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dt } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
const POLICY = [
  { window: 'More than 24 h before departure', refund: '90%', reschedule: 'Free' },
  { window: '2–24 h before departure', refund: '50%', reschedule: '1,000 MMK fee' },
  { window: 'Less than 2 h before departure', refund: 'No refund', reschedule: 'Not available' },
  { window: 'Trip cancelled by the operator', refund: '100% — authority minimum', reschedule: 'Free, any departure' },
]
export default function Refunds() {
  const { db, update, op } = useOperator()
  const toast = useToast()
  const [acting, setActing] = useState(null)
  const rows = db.tickets
    .filter((t) => t.operator === op.id)
    .map((t) => ({
      ...t,
      line: routes.find((r) => r.id === t.route)?.line,
      eligible: t.status === 'booked' || t.status === 'active',
    }))
  const refund = (reason) => {
    update((d) => {
      const t = d.tickets.find((x) => x.id === acting.id)
      t.status = 'refunded'
      t.refund = { at: new Date().toISOString(), amount: Math.round(t.fare * t.qty * 0.9), reason }
      d.wallet.balance += Math.round(t.fare * t.qty * 0.9)
      d.wallet.history.unshift({
        id: `W${Date.now()}`,
        at: new Date().toISOString(),
        type: 'refund',
        amount: Math.round(t.fare * t.qty * 0.9),
        note: `Refund ${t.id}`,
      })
    })
    toast({
      title: 'Refund approved',
      body: 'Refunded to the passenger wallet; the amount is held from your next settlement.',
    })
    setActing(null)
  }
  return (
    <>
      <PageHeader
        title="Refunds & reschedule"
        subtitle="Your refund and reschedule policy per product, never below the authority's minimum passenger-protection rules. Exceptions are approved with a written reason."
      />

      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Refund policy in force" subtitle="Published to passengers before payment" icon={Receipt} />
          <CardBody className="p-0">
            <DataTable
              search={false}
              dense
              columns={[
                { key: 'window', header: 'When the request is made' },
                { key: 'refund', header: 'Refund' },
                { key: 'reschedule', header: 'Reschedule' },
              ]}
              rows={POLICY.map((p, i) => ({ ...p, id: i }))}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Authority floor" />
          <CardBody>
            <p className="text-[12px] text-ink-600 leading-relaxed">
              {' '}
              refunds follow your policy but never fall below the authority's minimum passenger-protection rules. A trip
              cancelled by the operator is always a full refund, regardless of what your policy says.
            </p>
            <Badge tone="amber" className="mt-3">
              Refund SLA — 7 days to the original method
            </Badge>
          </CardBody>
        </Card>
      </div>

      <DataTable
        columns={[
          { key: 'pnr', header: 'PNR', render: (r) => <span className="font-mono">{r.pnr}</span> },
          { key: 'line', header: 'Line' },
          { key: 'passenger', header: 'Passenger' },
          { key: 'fare', header: 'Paid', align: 'right', render: (r) => MMK(r.fare * r.qty) },
          { key: 'purchasedAt', header: 'Purchased', render: (r) => dt(r.purchasedAt) },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          {
            key: '_a',
            header: '',
            sortable: false,
            align: 'right',
            render: (r) =>
              r.eligible ? (
                <Button
                  size="xs"
                  icon={RotateCcw}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActing(r)
                  }}
                >
                  Refund
                </Button>
              ) : null,
          },
        ]}
        rows={rows}
        exportName="refunds"
        empty="No tickets eligible for refund"
      />

      <ReasonDialog
        open={!!acting}
        onClose={() => setActing(null)}
        onConfirm={refund}
        title="Approve refund"
        confirmLabel="Refund passenger"
        variant="primary"
        subtitle={acting ? `${acting.pnr} — ${MMK(acting.fare * acting.qty)} paid` : ''}
      />
    </>
  )
}
