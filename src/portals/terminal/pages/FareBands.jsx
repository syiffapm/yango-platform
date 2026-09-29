import { useState } from 'react'
import { AlertTriangle, Check, Coins, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import PermissionGate from '../../../components/domain/PermissionGate.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import { Field, Input } from '../../../components/ui/Field.jsx'
import useCms from '../useCms.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dateOnly } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'

/**
 * Fare bands — the central authority sets a floor and a ceiling per route; operators
 * price inside it. A floor stops destructive undercutting, a ceiling stops
 * passengers being squeezed on a route with one operator.
 */
export default function FareBands() {
  const { db, update, audit, notify, can, role, setSes } = useCms()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [floor, setFloor] = useState('')
  const [cap, setCap] = useState('')
  if (!can.fareBands) {
    // Whoever does hold fare policy — offer to continue as them rather than stop here.
    const holderUser = db.users.find((u) => u.role === 'nat_policy')
    return (
      <>
        <PageHeader title="Fare bands" subtitle="Route price floors and ceilings" />
        <PermissionGate
          what="set fare policy"
          roleLabel={role.label}
          holder={
            holderUser && {
              name: holderUser.name,
              roleLabel: db.roles.find((r) => r.id === holderUser.role)?.label || 'the national policy officer',
            }
          }
          onSwitch={holderUser ? () => setSes({ userId: holderUser.id }) : undefined}
        />
      </>
    )
  }
  const rows = db.fareCaps.map((c) => {
    const route = routes.find((r) => r.id === c.route)
    const holders = route?.operators || (route ? [route.operator] : [])
    const operators = (db.operators || []).filter((o) => holders.includes(o.id))
    return {
      ...c,
      id: c.route,
      line: route?.line,
      name: route?.name,
      class: route?.class,
      operator: operators.map((o) => o.short).join(', ') || '—',
      priceSpread: Object.values(c.prices || {}),
      spread: c.cap - c.floor,
      outOfBand: c.current > c.cap || c.current < c.floor,
    }
  })
  const outOfBand = rows.filter((r) => r.outOfBand)
  const open = (r) => {
    setEditing(r)
    setFloor(String(r.floor))
    setCap(String(r.cap))
  }
  const commit = (reason) => {
    const f = Number(floor),
      c = Number(cap)
    if (!(f > 0) || !(c > f)) {
      toast({
        title: 'Band not valid',
        body: 'The ceiling must be above the floor and both must be positive.',
        kind: 'error',
      })
      return
    }
    update((d) => {
      const band = d.fareCaps.find((x) => x.route === editing.route)
      band.floor = f
      band.cap = c
      band.version += 1
      band.effectiveFrom = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
      band.setBy = 'cms_national'
      band.reason = reason
    })
    audit({
      actor: 'cms_national',
      role: 'nat_policy',
      action: 'Changed fare band',
      object: `${editing.line} · ${MMK(f)}–${MMK(c)}`,
      reason,
      category: 'Administration',
    })
    notify({
      audience: 'operator',
      title: `Fare band updated — ${editing.line}`,
      body: `New band ${MMK(f)} to ${MMK(c)}, effective in 7 days. Adjust your selling price in the Fares screen.`,
    })
    toast({
      title: 'Band updated',
      body: 'Effective in 7 days. Tickets already sold keep the price they were sold at.',
    })
    setEditing(null)
  }
  return (
    <>
      <PageHeader
        title="Fare bands"
        subtitle="The competitive range for every route. The centre sets the floor and the ceiling; each operator sets its own selling price inside the band from the Operator Portal."
        meta={
          <>
            <Badge tone="brand" icon={Coins}>
              {rows.length} routes
            </Badge>
            <Badge tone="slate">7-day notice period before a change bites</Badge>
          </>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Routes banded"
          value={rows.length}
          icon={Coins}
          method="Every licensed route carries a floor and a ceiling."
        />
        <Stat
          label="Priced outside the band"
          value={outOfBand.length}
          tone={outOfBand.length ? 'bad' : 'good'}
          method="Operators cannot publish a fare outside the band — the Operator Portal blocks the change at source."
        />
        <Stat
          label="Average band width"
          value={MMK(Math.round(rows.reduce((s, r) => s + r.spread, 0) / Math.max(1, rows.length)))}
          method="Ceiling minus floor, averaged. A wider band gives operators more room to differentiate."
        />
        <Stat
          label="Average price position"
          value={`${Math.round(rows.reduce((s, r) => s + ((r.current - r.floor) / Math.max(1, r.spread)) * 100, 0) / Math.max(1, rows.length))}%`}
          method="Where operators actually sit inside their band, on average. Near 0% means they are all at the floor."
        />
      </StatGrid>

      {outOfBand.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 mb-4 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-red-600 mt-px shrink-0" />
          <p className="text-[12px] text-red-900 leading-relaxed">
            {outOfBand.length} route{outOfBand.length > 1 ? 's are' : ' is'} priced outside the band:{' '}
            {outOfBand.map((r) => r.line).join(', ')}. Either widen the band or ask the operator to reprice — a fare
            outside the band cannot be published.
          </p>
        </div>
      )}

      <DataTable
        columns={[
          {
            key: 'line',
            header: 'Line',
            render: (r) => (
              <div>
                <span className="font-medium text-ink-900">{r.line}</span>
                <span className="block text-[11.5px] text-ink-400 truncate max-w-[180px]">{r.name}</span>
              </div>
            ),
          },
          {
            key: 'class',
            header: 'Class',
            render: (r) => (
              <Badge tone={r.class === 'Intercity' ? 'blue' : r.class === 'BRT' ? 'brand' : 'slate'}>{r.class}</Badge>
            ),
          },
          { key: 'operator', header: 'Operator' },
          { key: 'floor', header: 'Floor', align: 'right', render: (r) => MMK(r.floor) },
          { key: 'cap', header: 'Ceiling', align: 'right', render: (r) => MMK(r.cap) },
          {
            key: 'current',
            header: 'Operator prices',
            align: 'right',
            render: (r) => (
              <span className={r.outOfBand ? 'text-red-600 font-semibold' : 'text-ink-900 font-medium'}>
                {r.priceSpread.length > 1
                  ? `${MMK(Math.min(...r.priceSpread)).replace(' MMK', '')} – ${MMK(Math.max(...r.priceSpread))}`
                  : MMK(r.current)}
              </span>
            ),
          },
          {
            key: '_pos',
            header: 'Position in band',
            sortable: false,
            render: (r) => {
              const pos = Math.max(0, Math.min(100, ((r.current - r.floor) / Math.max(1, r.spread)) * 100))
              return (
                <div className="w-28 relative h-1.5 rounded-full bg-brand-100">
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-2 ring-white ${r.outOfBand ? 'bg-red-500' : 'bg-brand-600'}`}
                    style={{ left: `calc(${pos}% - 5px)` }}
                  />
                </div>
              )
            },
          },
          { key: 'version', header: 'Ver', align: 'right', render: (r) => <Badge tone="slate">v{r.version}</Badge> },
          { key: 'effectiveFrom', header: 'Effective', render: (r) => dateOnly(r.effectiveFrom) },
          {
            key: '_a',
            header: '',
            sortable: false,
            align: 'right',
            render: (r) => (
              <Button
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  open(r)
                }}
              >
                Set band
              </Button>
            ),
          },
        ]}
        rows={rows}
        exportName="fare-bands"
        searchKeys={['line', 'name', 'operator']}
        filters={[
          {
            key: 'class',
            label: 'Class',
            options: [...new Set(rows.map((r) => r.class))].map((c) => ({ value: c, label: c })),
          },
        ]}
        pageSize={14}
      />

      <div className="grid gap-4 lg:grid-cols-2 mt-4">
        <Card>
          <CardHeader title="How the band is enforced" icon={ShieldCheck} />
          <CardBody>
            <ol className="space-y-2.5 text-[12px] text-ink-700">
              {[
                'The centre publishes a floor and a ceiling per route, with a written reason and a 7-day notice period.',
                'The Operator Portal refuses to submit a fare outside the band and shows which bound was breached.',
                'The Citizen App only ever offers a price that sits inside the band in force on the day of sale.',
                'A band change is versioned and never retroactive — tickets already sold keep the price they were sold at.',
                'Repeated attempts to price outside the band are visible to the compliance officer as a pattern.',
              ].map((t, i) => (
                <li key={t} className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-800 text-[11px] font-semibold grid place-items-center">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Last change on each route" subtitle="Reason and version, for the audit trail" />
          <CardBody className="space-y-2 max-h-[300px] overflow-y-auto scroll-thin">
            {rows.slice(0, 8).map((r) => (
              <div key={r.route} className="rounded-lg border border-ink-200 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-ink-900">{r.line}</span>
                  <Badge tone="slate">v{r.version}</Badge>
                  <span className="ml-auto text-[11.5px] text-ink-400">{dateOnly(r.effectiveFrom)}</span>
                </div>
                <p className="text-[12.5px] text-ink-600 mt-1 leading-relaxed">“{r.reason}”</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <ReasonDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        onConfirm={commit}
        title={`Set fare band — ${editing?.line || ''}`}
        confirmLabel="Publish band"
        variant="primary"
        subtitle="Say why the band is changing. Operators are notified and have 7 days before it takes effect."
        extra={
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Floor (MMK)" required hint="Nobody may sell below this">
              <Input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} />
            </Field>
            <Field label="Ceiling (MMK)" required hint="Nobody may sell above this">
              <Input type="number" value={cap} onChange={(e) => setCap(e.target.value)} />
            </Field>
            {editing && (
              <p className="col-span-2 text-[12px] text-ink-500 inline-flex items-center gap-1.5">
                <Check size={12} className="text-brand-600" />
                Current selling price on this route is {MMK(editing.current)}.
              </p>
            )}
          </div>
        }
      />
    </>
  )
}
