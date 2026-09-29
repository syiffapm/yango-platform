import { useState } from 'react'
import { useTx } from '../../../lib/adminLang.js'
import { Link } from 'react-router-dom'
import { GitBranch, Map as MapIcon, ScanLine } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { Field, Input, Textarea } from '../../../components/ui/Field.jsx'
import MapView from '../../../components/domain/MapView.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { stops, terminals } from '../../../data/geo.js'
import { dateOnly } from '../../../lib/format.js'
export default function RoutesPage() {
  const tx = useTx()
  const { routes: myRoutes, permits, update, notify, op } = useOperator()
  const toast = useToast()
  const [variant, setVariant] = useState(null)
  const request = () => {
    const id = `APP-2026-${1300 + Math.floor(Math.random() * 400)}`
    update((d) => {
      d.applications.unshift({
        id,
        type: 'ROUTE',
        typeLabel: 'Route permit (amendment)',
        operator: op.id,
        applicantName: op.name,
        quantity: 1,
        note: `${variant.route.line}: ${variant.reason}`,
        state: 'submitted',
        officer: null,
        approver: null,
        submittedAt: new Date().toISOString(),
        slaDueAt: new Date(Date.now() + 5 * 86400000).toISOString(),
        fee: 0,
        paid: true,
        invoiceId: `INV-L-AMD-${id.slice(-4)}`,
        documents: [
          {
            name: 'Route variant plan',
            status: 'verified',
            uploadedAt: new Date().toISOString(),
            ocr: {},
            size: '412 KB',
          },
        ],
        checklist: [
          { item: 'Verify route variant plan', result: null, comment: '' },
          { item: 'Check terminal capacity', result: null, comment: '' },
        ],
        inspection: null,
        registryChecks: [{ registry: 'Company registry', result: 'match', ref: 'DICA-OK' }],
        decision: null,
        timeline: [{ at: new Date().toISOString(), actor: op.id, action: 'Route variant requested' }],
      })
    })
    notify({
      audience: 'authority',
      title: 'Route variant requested',
      body: `${op.name} requested a variant on ${variant.route.line}.`,
    })
    toast({ title: 'Variant requested', body: 'The authority must approve before the variant can be scheduled.' })
    setVariant(null)
  }
  return (
    <>
      <PageHeader
        title="Routes"
        subtitle="The lines you are permitted to operate, with the terms attached to each permit. Request a variant or a detour and the authority decides."
      />

      <Card className="mb-4">
        <CardHeader title="Your network" subtitle="Only your permitted lines are drawn" icon={MapIcon} />
        <CardBody className="p-0">
          <MapView highlightRoutes={myRoutes.map((r) => r.id)} vehicles={[]} height={280} />
        </CardBody>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {myRoutes.map((r) => {
          const permit = permits.find((p) => p.routeId === r.id)
          const stopNames = r.stops
            .map((s) => (stops.find((x) => x.id === s) || terminals.find((t) => t.id === s))?.name)
            .filter(Boolean)
          return (
            <Card key={r.id}>
              <CardHeader
                title={`${r.line} · ${r.name}`}
                subtitle={`${r.class} · ${r.km} km · ${stopNames.length} stops`}
                action={permit && <StatusPill status={permit.status} />}
              />
              <CardBody>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-3">
                  {[
                    ['Permitted hours', permit?.terms?.hours || r.hours],
                    ['Minimum headway', r.headwayMin ? `${r.headwayMin} min` : 'Timetabled'],
                    ['Vehicles required', permit?.terms?.vehiclesRequired ?? '—'],
                    ['Vehicles held', permit?.terms?.vehiclesHeld ?? '—'],
                    ['Fare', `${r.fare} MMK`],
                    ['Permit expiry', permit ? dateOnly(permit.expiry) : '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[11px] uppercase tracking-wider text-ink-400">{tx(k)}</p>
                      <p className="text-[12.5px] text-ink-900">{v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[12px] text-ink-500 leading-relaxed mb-3">{stopNames.join(' → ')}</p>
                <div className="flex gap-2">
                  <Button size="xs" icon={GitBranch} onClick={() => setVariant({ route: r, reason: '' })}>
                    Request variant
                  </Button>
                  {permit && (
                    <Button size="xs" variant="subtle" icon={ScanLine} as={Link} to={`/verify/${permit.id}`}>
                      Verify permit
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      <Modal
        open={!!variant}
        onClose={() => setVariant(null)}
        title={`Request a route variant — ${variant?.route.line || ''}`}
        subtitle="Variants and detours change permit terms, so they go to the licensing officer as an amendment."
        footer={
          <>
            <Button onClick={() => setVariant(null)}>Cancel</Button>
            <Button variant="primary" disabled={!variant?.reason} onClick={request}>
              Submit request
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field
            label="What changes?"
            required
            hint="Describe the new stops, the detour or the change in operating hours."
          >
            <Textarea
              rows={4}
              value={variant?.reason || ''}
              onChange={(e) => setVariant((s) => ({ ...s, reason: e.target.value }))}
            />
          </Field>
          <Field label="Requested effective date">
            <Input type="date" />
          </Field>
          <Badge tone="amber">No fee for an amendment — the permit version increments on approval</Badge>
        </div>
      </Modal>
    </>
  )
}
