import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Bus, ScanLine, Users, MapPin } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import useAuthority from '../useAuthority.js'
import { dateOnly, daysUntil, MMK } from '../../../lib/format.js'
import { routes, terminals, YBS_REGISTRY } from '../../../data/geo.js'
export default function Registries() {
  const { db } = useAuthority()
  const [tab, setTab] = useState('operators')
  const operators = (db.operators || []).map((o) => ({
    ...o,
    vehicles: db.vehicles.filter((v) => v.operator === o.id).length,
    drivers: db.drivers.filter((d) => d.operator === o.id).length,
    lines: routes.filter((r) => r.operator === o.id).length,
    findings: db.findings.filter((f) => f.operator === o.id).length,
  }))
  const vehicles = db.vehicles.map((v) => ({
    ...v,
    operatorName: (db.operators || []).find((o) => o.id === v.operator)?.short,
    line: routes.find((r) => r.id === v.route)?.line,
    days: daysUntil(v.licenceExpiry),
  }))
  const drivers = db.drivers.map((d) => ({
    ...d,
    operatorName: (db.operators || []).find((o) => o.id === d.operator)?.short,
    plate: db.vehicles.find((v) => v.id === d.vehicle)?.plate || '—',
    days: daysUntil(d.licenceExpiry),
  }))
  const terminalRows = terminals.map((t) => ({
    ...t,
    bayCount: t.bays.length,
    operatorCount: t.operators.length,
    departures: db.departures.filter((d) => d.boardingPoints.includes(t.id)).length,
  }))
  const instrumented = new Map(routes.map((r) => [String(r.line).replace(/^YBS-/, ''), r]))
  const lineRows = YBS_REGISTRY.map((l) => {
    const live = instrumented.get(l.line)
    return {
      id: `YBS-${l.line}`,
      line: l.line,
      from: l.from,
      to: l.to,
      holders: l.holders.join(', ') || '—',
      state: live ? 'live' : 'registry',
      fare: live ? live.fare : null,
      km: live ? live.km : null,
    }
  })

  return (
    <>
      <PageHeader
        title="Registries"
        subtitle="Operators, fleet, drivers and terminals with their licence status. Filed once by the operator and reused everywhere; nothing is re-keyed."
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Operators"
          value={operators.length}
          icon={Building2}
          method="Companies holding a PO business licence in this jurisdiction."
        />
        <Stat
          label="Vehicles"
          value={vehicles.length}
          icon={Bus}
          method="Vehicles with a fleet licence on the register."
        />
        <Stat
          label="Drivers"
          value={drivers.length}
          icon={Users}
          method="Drivers with an operating licence bound to a licensed operator."
        />
        <Stat
          label="Terminals"
          value={terminalRows.length}
          icon={MapPin}
          method="Terminals with a registered geofence, bays and facilities."
        />
      </StatGrid>

      {/* Published lines, and whether this platform yet carries them. */}
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { value: 'operators', label: 'Operators', count: operators.length },
          { value: 'vehicles', label: 'Fleet', count: vehicles.length },
          { value: 'drivers', label: 'Drivers', count: drivers.length },
          { value: 'terminals', label: 'Terminals', count: terminalRows.length },
          { value: 'lines', label: 'YBS lines', count: lineRows.length },
        ]}
      />

      {tab === 'operators' && (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Operator',
              render: (r) => (
                <div>
                  <span className="font-medium text-ink-900">{r.name}</span>
                  <span className="block text-[11.5px] text-ink-400">
                    {r.short} · reg {r.regNo}
                  </span>
                </div>
              ),
            },
            { key: 'depot', header: 'Depot' },
            { key: 'lines', header: 'Lines', align: 'right' },
            { key: 'vehicles', header: 'Vehicles', align: 'right' },
            { key: 'drivers', header: 'Drivers', align: 'right' },
            {
              key: 'findings',
              header: 'Findings',
              align: 'right',
              render: (r) => (r.findings ? <Badge tone="amber">{r.findings}</Badge> : '—'),
            },
            { key: 'rating', header: 'Rating', align: 'right', render: (r) => `${r.rating} ★` },
            { key: 'since', header: 'Licensed since', render: (r) => dateOnly(r.since) },
            { key: 'licence', header: 'Status', render: (r) => <StatusPill status={r.licence} /> },
          ]}
          rows={operators}
          exportName="operator-registry"
          searchKeys={['name', 'short', 'regNo', 'taxId']}
        />
      )}

      {tab === 'vehicles' && (
        <DataTable
          columns={[
            {
              key: 'plate',
              header: 'Plate',
              render: (r) => <span className="font-medium text-ink-900">{r.plate}</span>,
            },
            { key: 'operatorName', header: 'Operator' },
            { key: 'line', header: 'Line' },
            { key: 'class', header: 'Class' },
            { key: 'capacity', header: 'Seats', align: 'right' },
            { key: 'imei', header: 'GPS IMEI', render: (r) => <span className="font-mono text-[12px]">{r.imei}</span> },
            {
              key: 'dashcam',
              header: 'Devices',
              sortable: false,
              render: (r) => (
                <span className="flex gap-1">
                  <Badge tone="slate">GPS</Badge>
                  {r.dashcam && <Badge tone="blue">MDVR</Badge>}
                  {r.apc && <Badge tone="violet">APC</Badge>}
                </span>
              ),
            },
            {
              key: 'licenceExpiry',
              header: 'Licence to',
              render: (r) => <span className={r.days <= 90 ? 'text-amber-700' : ''}>{dateOnly(r.licenceExpiry)}</span>,
            },
            { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          ]}
          rows={vehicles}
          exportName="fleet-registry"
          searchKeys={['plate', 'chassis', 'imei', 'operatorName']}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: ['active', 'blocked', 'maintenance'].map((s) => ({ value: s, label: s })),
            },
          ]}
          pageSize={14}
        />
      )}

      {tab === 'drivers' && (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Driver',
              render: (r) => (
                <div>
                  <span className="font-medium text-ink-900">{r.name}</span>
                  <span className="block text-[11.5px] text-ink-400 font-mono">{r.nrc}</span>
                </div>
              ),
            },
            { key: 'operatorName', header: 'Operator' },
            { key: 'licenceNo', header: 'Licence' },
            { key: 'licenceClass', header: 'Class', render: (r) => <Badge tone="slate">{r.licenceClass}</Badge> },
            { key: 'plate', header: 'Regular bus' },
            {
              key: 'violations',
              header: 'Violations',
              align: 'right',
              render: (r) => (r.violations ? <Badge tone="amber">{r.violations}</Badge> : '—'),
            },
            { key: 'rating', header: 'Rating', align: 'right', render: (r) => (r.rating ? `${r.rating} ★` : '—') },
            { key: 'licenceExpiry', header: 'Licence to', render: (r) => dateOnly(r.licenceExpiry) },
            { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          ]}
          rows={drivers}
          exportName="driver-registry"
          searchKeys={['name', 'nrc', 'licenceNo']}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: ['active', 'pending', 'blocked'].map((s) => ({ value: s, label: s })),
            },
          ]}
          pageSize={14}
        />
      )}

      {tab === 'terminals' && (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Terminal',
              render: (r) => (
                <div>
                  <span className="font-medium text-ink-900">{r.name}</span>
                  <span className="block text-[11.5px] text-ink-400">{r.nameMM}</span>
                </div>
              ),
            },
            { key: 'openHours', header: 'Hours' },
            { key: 'bayCount', header: 'Bays', align: 'right' },
            { key: 'operatorCount', header: 'Operators', align: 'right' },
            { key: 'departures', header: 'Departures (14d)', align: 'right' },
            {
              key: 'facilities',
              header: 'Facilities',
              sortable: false,
              render: (r) => (
                <span className="flex flex-wrap gap-1">
                  {r.facilities.slice(0, 4).map((f) => (
                    <Badge key={f} tone="slate">
                      {f}
                    </Badge>
                  ))}
                </span>
              ),
            },
            {
              key: '_a',
              header: '',
              sortable: false,
              align: 'right',
              render: (r) => (
                <Button size="xs" icon={ScanLine} as={Link} to={`/board/${r.id}`}>
                  Board
                </Button>
              ),
            },
          ]}
          rows={terminalRows}
          exportName="terminal-registry"
        />
      )}

      {tab === 'lines' && (
        <DataTable
          columns={[
            {
              key: 'line',
              header: 'Line',
              render: (r) => (
                <span className="px-2 py-1 rounded text-[12px] font-bold text-white bg-brand-600">
                  {r.line === 'AP' ? 'AP' : `YBS-${r.line}`}
                </span>
              ),
            },
            { key: 'from', header: 'From' },
            { key: 'to', header: 'To' },
            { key: 'holders', header: 'Licensed operators' },
            {
              key: 'state',
              header: 'On the platform',
              render: (r) =>
                r.state === 'live' ? <Badge tone="green">Tracked</Badge> : <Badge tone="slate">Registry only</Badge>,
            },
            {
              key: 'fare',
              header: 'Fare',
              align: 'right',
              render: (r) => (r.fare ? MMK(r.fare) : '—'),
            },
          ]}
          rows={lineRows}
          searchKeys={['line', 'from', 'to', 'holders']}
          filters={[
            {
              key: 'state',
              label: 'Status',
              options: [
                { value: 'live', label: 'Tracked' },
                { value: 'registry', label: 'Registry only' },
              ],
            },
          ]}
          pageSize={16}
          empty="No lines in the register"
        />
      )}
    </>
  )
}
