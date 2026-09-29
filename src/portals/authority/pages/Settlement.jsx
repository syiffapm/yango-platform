import { useState } from 'react'
import { AlertTriangle, Landmark, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import useAuthority from '../useAuthority.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dateOnly, num } from '../../../lib/format.js'
export default function Settlement() {
  const { db, update, audit, me, can } = useAuthority()
  const toast = useToast()
  const [reconciling, setReconciling] = useState(null)
  const rows = db.settlements.map((s) => ({
    ...s,
    operatorName: (db.operators || []).find((o) => o.id === s.operator)?.name || s.operator,
  }))
  const failed = rows.filter((r) => r.status === 'failed')
  const held = rows.filter((r) => r.held > 0)
  const totalNet = rows.reduce((s, r) => s + r.net, 0)
  const exceptions = db.reconciliation.reduce((s, r) => s + r.exceptions, 0)
  const clearException = (reason) => {
    update((d) => {
      const r = d.reconciliation.find((x) => x.date === reconciling.date)
      r.exceptions = 0
      r.status = 'balanced'
    })
    audit({
      actor: me.id,
      role: me.role,
      action: 'Cleared reconciliation exception',
      object: reconciling.date,
      reason,
      category: 'Administration',
    })
    toast({ title: 'Exception cleared', body: 'The day now reconciles across provider, ledger and bank.' })
    setReconciling(null)
  }
  return (
    <>
      <PageHeader
        title="Settlement oversight"
        subtitle="Payouts to operators, failures, disputes and reconciliation status. Settlement is T+1 net of platform fee, levy and payment fees; disputed amounts are held."
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Net paid out"
          value={MMK(totalNet)}
          icon={Landmark}
          method="Sum of the latest settlement run across every operator."
        />
        <Stat
          label="Failed payouts"
          value={failed.length}
          tone={failed.length ? 'bad' : 'good'}
          method="Bank transfers that did not settle. They are retried and the operator is notified."
        />
        <Stat
          label="Amounts held"
          value={MMK(rows.reduce((s, r) => s + r.held, 0))}
          tone={held.length ? 'warn' : 'default'}
          method="Withheld pending a refund dispute or chargeback."
        />
        <Stat
          label="Reconciliation exceptions"
          value={exceptions}
          tone={exceptions ? 'warn' : 'good'}
          method="Days where provider, ledger and bank figures do not agree. Each needs a written resolution."
        />
      </StatGrid>

      <Card className="mb-4">
        <CardHeader title="Latest settlement run" subtitle="T+1 payouts per operator" />
        <CardBody className="p-0">
          <DataTable
            columns={[
              { key: 'operatorName', header: 'Operator' },
              { key: 'date', header: 'Service day', render: (r) => dateOnly(r.date) },
              { key: 'gross', header: 'Gross', align: 'right', render: (r) => MMK(r.gross) },
              { key: 'platformFee', header: 'Platform fee', align: 'right', render: (r) => MMK(r.platformFee) },
              { key: 'levy', header: 'Levy', align: 'right', render: (r) => MMK(r.levy) },
              { key: 'paymentFee', header: 'Payment fee', align: 'right', render: (r) => MMK(r.paymentFee) },
              {
                key: 'held',
                header: 'Held',
                align: 'right',
                render: (r) => (r.held ? <span className="text-amber-700">{MMK(r.held)}</span> : '—'),
              },
              {
                key: 'net',
                header: 'Net paid',
                align: 'right',
                render: (r) => <span className="font-medium">{MMK(r.net)}</span>,
              },
              { key: 'bank', header: 'Bank' },
              { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
            ]}
            rows={rows}
            exportName="settlement-oversight"
            searchKeys={['operatorName', 'ref']}
          />
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Three-way reconciliation"
            subtitle="Payment provider · platform ledger · bank statement"
            icon={RefreshCw}
          />
          <CardBody className="p-0">
            <DataTable
              search={false}
              columns={[
                { key: 'date', header: 'Date', render: (r) => dateOnly(r.date) },
                { key: 'provider', header: 'Provider', align: 'right', render: (r) => num(r.provider) },
                { key: 'ledger', header: 'Ledger', align: 'right', render: (r) => num(r.ledger) },
                { key: 'bank', header: 'Bank', align: 'right', render: (r) => num(r.bank) },
                {
                  key: 'exceptions',
                  header: 'Exceptions',
                  align: 'right',
                  render: (r) => (r.exceptions ? <Badge tone="amber">{r.exceptions}</Badge> : '—'),
                },
                { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
                {
                  key: '_a',
                  header: '',
                  sortable: false,
                  align: 'right',
                  render: (r) =>
                    r.exceptions && can.reconcile ? (
                      <Button
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          setReconciling(r)
                        }}
                      >
                        Resolve
                      </Button>
                    ) : null,
                },
              ]}
              rows={db.reconciliation.map((r) => ({ ...r, id: r.date }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Exceptions queue"
            icon={AlertTriangle}
            subtitle="Every exception needs a written resolution before the day can be signed off"
          />
          <CardBody className="space-y-2">
            {db.reconciliation
              .filter((r) => r.exceptions)
              .map((r) => (
                <div key={r.date} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[12.5px] font-medium text-amber-900">
                    {dateOnly(r.date)} — {r.exceptions} exception(s)
                  </p>
                  <p className="text-[12px] text-amber-800 mt-1">
                    Provider total differs from the ledger by {MMK(r.provider - r.ledger)}. Likely a late callback from
                    a wallet provider.
                  </p>
                  {can.reconcile && (
                    <Button size="xs" variant="primary" className="mt-2" onClick={() => setReconciling(r)}>
                      Resolve with reason
                    </Button>
                  )}
                </div>
              ))}
            {exceptions === 0 && <p className="text-[12px] text-ink-400">Every day in the window reconciles.</p>}
            {!can.reconcile && (
              <p className="text-[12px] text-ink-400 pt-1">
                Only the finance officer may resolve exceptions, and only with a written reason.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <ReasonDialog
        open={!!reconciling}
        onClose={() => setReconciling(null)}
        onConfirm={clearException}
        title="Resolve reconciliation exception"
        confirmLabel="Resolve"
        variant="primary"
        minLength={20}
        subtitle={reconciling ? `${dateOnly(reconciling.date)} — explain the difference and the correcting entry.` : ''}
      />
    </>
  )
}
