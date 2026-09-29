import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { relative } from '../../../lib/format.js'
export default function Maintenance() {
  const { db, update, maintenance, vehicles } = useOperator()
  const toast = useToast()
  const rows = maintenance.map((m) => ({ ...m, plate: vehicles.find((v) => v.id === m.vehicle)?.plate || m.vehicle }))
  const close = (m) => {
    update((d) => {
      const w = d.maintenance.find((x) => x.id === m.id)
      w.status = 'closed'
      if (w.blocksVehicle) {
        w.blocksVehicle = false
        const veh = d.vehicles.find((v) => v.id === w.vehicle)
        if (veh && veh.status === 'blocked') veh.status = 'active'
      }
    })
    toast({ title: 'Work order closed', body: 'The vehicle is released back into service.' })
  }
  return (
    <>
      <PageHeader
        title="Maintenance"
        subtitle="Service schedule, defects raised at driver pre-trip inspection, work orders and downtime. A critical defect blocks the vehicle until the work order is closed."
      />
      <StatGrid cols={3} className="mb-5">
        <Stat
          label="Open work orders"
          value={rows.filter((r) => r.status !== 'closed').length}
          method="Defects and services not yet completed."
        />
        <Stat
          label="Vehicles blocked"
          value={rows.filter((r) => r.blocksVehicle).length}
          tone={rows.some((r) => r.blocksVehicle) ? 'bad' : 'good'}
          method="Vehicles that cannot be rostered because of a critical defect."
        />
        <Stat
          label="Fleet availability"
          value={`${Math.round((vehicles.filter((v) => v.status === 'active').length / Math.max(1, vehicles.length)) * 100)}%`}
          method="Active vehicles ÷ registered vehicles. Compared against the permit's fleet-availability dimension."
        />
      </StatGrid>

      <DataTable
        columns={[
          { key: 'id', header: 'Work order' },
          { key: 'plate', header: 'Vehicle' },
          { key: 'item', header: 'Item' },
          { key: 'source', header: 'Raised by' },
          {
            key: 'severity',
            header: 'Severity',
            render: (r) => (
              <Badge tone={r.severity === 'critical' ? 'red' : r.severity === 'major' ? 'amber' : 'slate'}>
                {r.severity}
              </Badge>
            ),
          },
          {
            key: 'blocksVehicle',
            header: 'Blocks bus',
            render: (r) => (r.blocksVehicle ? <Badge tone="red">Blocked</Badge> : '—'),
          },
          { key: 'opened', header: 'Opened', render: (r) => relative(r.opened) },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          {
            key: '_a',
            header: '',
            sortable: false,
            align: 'right',
            render: (r) =>
              r.status !== 'closed' ? (
                <Button
                  size="xs"
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    close(r)
                  }}
                >
                  Close
                </Button>
              ) : null,
          },
        ]}
        rows={rows}
        exportName="maintenance"
        empty="No work orders"
      />
      <p className="text-[12px] text-ink-400 mt-3">
        Defects flow in automatically from the Driver App pre-trip inspection (
        {db.maintenance.filter((m) => m.source === 'Driver inspection').length} in this register).
      </p>
    </>
  )
}
