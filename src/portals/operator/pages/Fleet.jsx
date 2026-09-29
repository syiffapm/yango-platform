import { useNavigate } from 'react-router-dom'
import { Bus, Plus } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Button from '../../../components/ui/Button.jsx'
import useOperator from '../useOperator.js'
import { dateOnly, daysUntil } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
export default function Fleet() {
  const { vehicles } = useOperator()
  const nav = useNavigate()
  const rows = vehicles.map((v) => ({
    ...v,
    routeLabel: routes.find((r) => r.id === v.route)?.line || '—',
    licenceDays: daysUntil(v.licenceExpiry),
  }))
  return (
    <>
      <PageHeader
        title="Fleet"
        subtitle="Vehicle master: plate, chassis, class, capacity, seat layout, amenities, devices, documents and status. A vehicle can only be scheduled and sold if its licence and route permit are valid."
        actions={
          <Button variant="primary" icon={Plus}>
            Add vehicle
          </Button>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat label="Vehicles" value={vehicles.length} icon={Bus} method="Vehicles registered to your company." />
        <Stat
          label="Active"
          value={vehicles.filter((v) => v.status === 'active').length}
          tone="good"
          method="Licensed, not blocked and not in maintenance."
        />
        <Stat
          label="Blocked"
          value={vehicles.filter((v) => v.status === 'blocked').length}
          tone={vehicles.some((v) => v.status === 'blocked') ? 'bad' : 'default'}
          method="Blocked by a critical defect or a suspended vehicle licence — cannot be rostered or sold."
        />
        <Stat
          label="Licence ≤ 90 days"
          value={rows.filter((r) => r.licenceDays <= 90 && r.licenceDays > 0).length}
          tone="warn"
          method="Vehicle licences approaching expiry. Reminders at 90/60/30/7 days."
        />
      </StatGrid>

      <DataTable
        columns={[
          { key: 'plate', header: 'Plate', render: (r) => <span className="font-medium text-ink-900">{r.plate}</span> },
          { key: 'class', header: 'Class' },
          { key: 'routeLabel', header: 'Line' },
          { key: 'capacity', header: 'Seats', align: 'right' },
          { key: 'seatLayout', header: 'Layout' },
          {
            key: 'amenities',
            header: 'Amenities',
            sortable: false,
            render: (r) => (
              <span className="flex flex-wrap gap-1">
                {r.amenities.slice(0, 3).map((a) => (
                  <Badge key={a} tone="slate">
                    {a}
                  </Badge>
                ))}
              </span>
            ),
          },
          { key: 'imei', header: 'GPS IMEI', render: (r) => <span className="font-mono text-[12px]">{r.imei}</span> },
          {
            key: 'licenceExpiry',
            header: 'Licence to',
            render: (r) => (
              <span className={r.licenceDays <= 90 ? 'text-amber-700 font-medium' : ''}>
                {dateOnly(r.licenceExpiry)}
              </span>
            ),
          },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
        ]}
        rows={rows}
        onRowClick={(r) => nav(`/operator/fleet/${r.id}`)}
        searchKeys={['plate', 'chassis', 'class', 'imei']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'blocked', label: 'Blocked' },
              { value: 'maintenance', label: 'Maintenance' },
            ],
          },
        ]}
        exportName="fleet"
        pageSize={12}
      />
    </>
  )
}
