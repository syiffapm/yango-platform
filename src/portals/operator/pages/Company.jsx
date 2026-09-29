import { useState } from 'react'
import { useTx } from '../../../lib/adminLang.js'
import { Building2, Landmark, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import { Field, Input } from '../../../components/ui/Field.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { dateOnly } from '../../../lib/format.js'
export default function Company() {
  const tx = useTx()
  const { op, update, audit, notify, vehicles, drivers } = useOperator()
  const toast = useToast()
  const [bank, setBank] = useState(op.bank)
  const [confirming, setConfirming] = useState(false)
  const saveBank = (reason) => {
    update((d) => {
      const o = d.operators?.find?.((x) => x.id === op.id)
      if (o) o.bank = bank
    })
    audit({
      actor: op.id,
      role: 'po_admin',
      action: 'Changed settlement bank account',
      object: op.id,
      reason,
      category: 'Administration',
    })
    notify({
      audience: 'authority',
      title: 'Bank account change',
      body: `${op.name} changed its settlement account. Two approvals were required.`,
    })
    toast({ title: 'Change submitted', body: 'A second approver in your company and the authority are both notified.' })
    setConfirming(false)
  }
  return (
    <>
      <PageHeader
        title="Company profile"
        subtitle="Company details, depots and the bank account used for settlement. Changing the settlement account requires two approvals and notifies the authority."
        meta={
          <>
            <StatusPill status={op.licence} />
            <Badge tone="slate">Operating since {dateOnly(op.since)}</Badge>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Registered details" icon={Building2} />
          <CardBody className="grid sm:grid-cols-2 gap-4">
            <Field label="Company name">
              <Input defaultValue={op.name} readOnly />
            </Field>
            <Field label="Short code">
              <Input defaultValue={op.short} readOnly />
            </Field>
            <Field label="Company registration no." hint="Verified against the company registry">
              <Input defaultValue={op.regNo} readOnly />
            </Field>
            <Field label="Tax identification">
              <Input defaultValue={op.taxId} readOnly />
            </Field>
            <Field label="Registered address" className="sm:col-span-2">
              <Input defaultValue={op.address} />
            </Field>
            <Field label="Phone">
              <Input defaultValue={op.phone} />
            </Field>
            <Field label="Email">
              <Input defaultValue={op.email} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Settlement bank account" icon={Landmark} subtitle="Where your T+1 payout is credited" />
          <CardBody className="space-y-3">
            <Field label="Bank">
              <Input value={bank.name} onChange={(e) => setBank((b) => ({ ...b, name: e.target.value }))} />
            </Field>
            <Field label="Account number">
              <Input value={bank.acc} onChange={(e) => setBank((b) => ({ ...b, acc: e.target.value }))} />
            </Field>
            <Field label="Account holder" hint="Must match the registered company name">
              <Input value={bank.holder} onChange={(e) => setBank((b) => ({ ...b, holder: e.target.value }))} />
            </Field>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2.5">
              <ShieldCheck size={15} className="text-amber-600 shrink-0 mt-px" />
              <p className="text-[12.5px] text-amber-900 leading-relaxed">
                A change to the settlement account needs a written reason, a second approval inside your company and a
                notification to the authority before the next payout run.
              </p>
            </div>
            <Button variant="primary" onClick={() => setConfirming(true)}>
              Request account change
            </Button>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Depots and scale" />
          <CardBody className="grid sm:grid-cols-4 gap-4">
            {[
              ['Primary depot', op.depot],
              ['Vehicles', vehicles.length],
              ['Drivers', drivers.length],
              ['Average rating', `${op.rating} / 5`],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[11.5px] uppercase tracking-wider text-ink-400">{tx(k)}</p>
                <p className="text-[14px] font-medium text-ink-900 mt-0.5">{v}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <ReasonDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={saveBank}
        title="Change settlement account"
        confirmLabel="Submit for second approval"
        variant="primary"
        subtitle="State why the account is changing. Fraudulent account changes are the single largest settlement risk."
      />
    </>
  )
}
