import { useState } from 'react'
import { AlertTriangle, Coins, Plus, Save } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Field, Input } from '../../../components/ui/Field.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK } from '../../../lib/format.js'
const CONCESSIONS = [
  { code: 'STUDENT', label: 'Student', discount: 50, proof: 'Student card' },
  { code: 'ELDERLY', label: 'Elderly (60+)', discount: 50, proof: 'National ID' },
  { code: 'DISABLED', label: 'Disability', discount: 100, proof: 'Disability card' },
  { code: 'CHILD', label: 'Child under 6', discount: 100, proof: 'None' },
]
export default function Fares() {
  const { routes: myRoutes, db, update, op } = useOperator()
  const toast = useToast()
  const [draft, setDraft] = useState({})
  const [promo, setPromo] = useState({ code: '', pct: 10 })
  const rows = myRoutes.map((r) => {
    const band = db.fareCaps.find((c) => c.route === r.id)
    const floor = band?.floor ?? 0
    const cap = band?.cap ?? r.fare
    const current = band?.prices?.[op.id] ?? band?.current ?? r.fare
    const proposed = draft[r.id] ?? current
    return {
      ...r,
      floor,
      cap,
      current,
      proposed,
      overCap: proposed > cap,
      underFloor: proposed < floor,
      outOfBand: proposed > cap || proposed < floor,
    }
  })
  const save = () => {
    const bad = rows.find((r) => r.outOfBand)
    if (bad) {
      toast({
        title: bad.overCap ? 'Above the fare ceiling' : 'Below the fare floor',
        body: `${bad.line}: ${MMK(bad.proposed)} is outside the band ${MMK(bad.floor)}–${MMK(bad.cap)} set by the authority.`,
        kind: 'error',
      })
      return
    }
    const changed = rows.filter((r) => r.proposed !== r.current)
    if (!changed.length) {
      toast({ title: 'Nothing to submit', body: 'No fare has been changed.', kind: 'info' })
      return
    }
    update((d) => {
      changed.forEach((r) => {
        const band = d.fareCaps.find((c) => c.route === r.id)
        if (!band) return (band.prices = { ...(band.prices || {}), [op.id]: r.proposed })
        // The headline figure tracks the cheapest operator on the line. band.current =
        Math.min(...Object.values(band.prices))
      })
    })
    setDraft({})
    toast({
      title: `${changed.length} fare(s) submitted`,
      body: 'Inside the authority band. A 7-day notice period applies before the new fare takes effect.',
    })
  }
  return (
    <>
      <PageHeader
        title="Fares & promotions"
        subtitle="Fares per route and class, concessions, promo codes and passes. You set the selling price inside the band the authority publishes for each route, and a change needs a 7-day notice period."
        actions={
          <Button variant="primary" icon={Save} onClick={save}>
            Submit fare change
          </Button>
        }
      />

      <Card className="mb-4">
        <CardHeader
          title="Fares by line"
          subtitle="Authority fare caps are enforced in the data layer, not only in this screen."
          icon={Coins}
        />
        <CardBody className="p-0">
          <div className="divide-y divide-ink-100">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <div className="w-48 min-w-0">
                  <p className="text-[12.5px] font-medium text-ink-900">{r.line}</p>
                  <p className="text-[11.5px] text-ink-400 truncate">{r.name}</p>
                </div>
                <Badge tone="slate">{r.class}</Badge>
                {(r.operators || []).filter((o) => o !== op.id).length > 0 && (
                  <Badge tone="amber">
                    {' '}
                    shared with{' '}
                    {(r.operators || [])
                      .filter((o) => o !== op.id)
                      .map((o) => (db.operators || []).find((x) => x.id === o)?.short)
                      .join(', ')}
                  </Badge>
                )}
                <div className="w-28">
                  <p className="text-[11px] uppercase tracking-wider text-ink-400">Current</p>
                  <p className="text-[13px] text-ink-900">{MMK(r.current)}</p>
                </div>
                <div className="w-44">
                  <p className="text-[11px] uppercase tracking-wider text-ink-400">Authority band</p>
                  <p className="text-[13px] text-ink-600">
                    {MMK(r.floor).replace(' MMK', '')} – {MMK(r.cap)}
                  </p>
                </div>
                <div className="w-36">
                  <Input
                    type="number"
                    value={r.proposed}
                    onChange={(e) => setDraft((d) => ({ ...d, [r.id]: Number(e.target.value) }))}
                    className={r.outOfBand ? 'border-red-400 ring-2 ring-red-100' : ''}
                  />
                </div>
                {r.outOfBand && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-red-600">
                    <AlertTriangle size={13} /> {r.overCap ? 'Above ceiling' : 'Below floor'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Concessions" subtitle="Applied at checkout when the passenger presents proof" />
          <CardBody className="p-0">
            <DataTable
              search={false}
              dense
              columns={[
                { key: 'label', header: 'Concession' },
                { key: 'discount', header: 'Discount', align: 'right', render: (r) => `${r.discount}%` },
                { key: 'proof', header: 'Proof required' },
              ]}
              rows={CONCESSIONS}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Promo codes & passes"
            action={
              <Button
                size="xs"
                icon={Plus}
                onClick={() =>
                  toast({
                    title: 'Promo created',
                    body: `${promo.code || 'NEWCODE'} — ${promo.pct}% off, capped by the fare cap.`,
                  })
                }
              >
                Create
              </Button>
            }
          />
          <CardBody className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Code">
                <Input
                  value={promo.code}
                  onChange={(e) => setPromo((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="THADINGYUT26"
                />
              </Field>
              <Field label="Discount %">
                <Input
                  type="number"
                  value={promo.pct}
                  onChange={(e) => setPromo((p) => ({ ...p, pct: e.target.value }))}
                />
              </Field>
            </div>
            <div className="rounded-lg border border-ink-200 p-3">
              <p className="text-[12.5px] font-medium text-ink-900">Bus Plus subscription</p>
              <p className="text-[12px] text-ink-500 mt-0.5 leading-relaxed">
                Monthly pass with a 15% discount and 10 free urban rides. Pricing is pending approval with the
                authority.
              </p>
              <Badge tone="amber" className="mt-2">
                Pending authority pricing
              </Badge>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
