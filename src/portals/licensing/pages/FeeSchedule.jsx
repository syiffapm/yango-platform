import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import { Field, Input } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dateOnly } from '../../../lib/format.js'
export default function FeeSchedule() {
  const { db, update, audit } = useDb()
  const [ses] = useSession('licensing')
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [amount, setAmount] = useState('')
  const commit = (reason) => {
    update((d) => {
      const f = d.feeSchedule.find((x) => x.code === editing.code)
      f.amount = Number(amount)
      f.version += 1
      f.effectiveFrom = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
      f.reason = reason
      f.approvedBy = ses.userId
    })
    audit({
      actor: ses.userId,
      role: 'nat_policy',
      action: 'Changed fee schedule',
      object: editing.label,
      reason,
      category: 'Administration',
    })
    toast({ title: 'Fee updated', body: 'Takes effect in 7 days. Invoices already issued keep the old figure.' })
    setEditing(null)
  }
  return (
    <>
      <PageHeader
        title="Fee schedule"
        subtitle="Amounts, effective dates, reason and approval. Changes apply from the moment they are saved and never rewrite invoices already issued."
        meta={
          <Badge tone="brand" icon={Settings2}>
            Versioned · never retroactive
          </Badge>
        }
      />

      <DataTable
        search={false}
        columns={[
          { key: 'label', header: 'Licence type' },
          {
            key: 'amount',
            header: 'Fee',
            align: 'right',
            render: (r) => <span className="font-medium">{MMK(r.amount)}</span>,
          },
          { key: 'effectiveFrom', header: 'Effective from', render: (r) => dateOnly(r.effectiveFrom) },
          { key: 'version', header: 'Version', render: (r) => <Badge tone="slate">v{r.version}</Badge> },
          { key: 'reason', header: 'Reason for last change', className: 'max-w-xs' },
          {
            key: '_a',
            header: '',
            sortable: false,
            align: 'right',
            render: (r) => (
              <Button
                size="xs"
                onClick={() => {
                  setEditing(r)
                  setAmount(String(r.amount))
                }}
              >
                Amend
              </Button>
            ),
          },
        ]}
        rows={db.feeSchedule}
        exportName="fee-schedule"
      />

      <Card className="mt-4">
        <CardHeader title="How fees reach the treasury" subtitle="Money flow for regulated revenue" />
        <CardBody>
          <ol className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-600">
            {[
              'Invoice issued on submission',
              'Payment (VA / wallet / card / counter)',
              'Numbered signed e-receipt',
              'Posting to treasury account',
              'Daily reconciliation',
            ].map((s, i, arr) => (
              <li key={s} className="flex items-center gap-2">
                <span className="rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5">{s}</span>
                {i < arr.length - 1 && <span className="text-ink-300">→</span>}
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      <ReasonDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        onConfirm={commit}
        title={`Amend fee — ${editing?.label || ''}`}
        confirmLabel="Save new amount"
        variant="primary"
        subtitle="Only the national policy officer may change fees, and the change takes effect after a 7-day notice period."
        extra={
          <Field label="New amount (MMK)" required className="mb-4">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
        }
      />
    </>
  )
}
