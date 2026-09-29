import { Link } from 'react-router-dom'
import { ScanLine, ScrollText } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import { useDb } from '../../../lib/store.jsx'
import { dateOnly, daysUntil } from '../../../lib/format.js'
import { licenceTypes } from '../../../data/org.js'
export default function Register() {
  const { db } = useDb()
  const rows = db.permits.map((p) => ({
    ...p,
    typeLabel: licenceTypes.find((t) => t.code === p.type)?.label || p.type,
    days: daysUntil(p.expiry),
  }))
  const expiring = rows.filter((r) => r.days <= 90 && r.days > 0 && r.status === 'valid')
  return (
    <>
      <PageHeader
        title="Licence register"
        subtitle="Every permit with its terms and change history. Permit changes are versioned and never retroactive to findings already issued."
        meta={
          <Badge tone="brand" icon={ScrollText}>
            {rows.length} permits
          </Badge>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Valid"
          value={rows.filter((r) => r.status === 'valid').length}
          tone="good"
          method="Permits currently in force."
        />
        <Stat
          label="Expiring ≤ 90 days"
          value={expiring.length}
          tone={expiring.length ? 'warn' : 'default'}
          method="Reminders go out at 90/60/30/7 days."
        />
        <Stat
          label="Suspended"
          value={rows.filter((r) => r.status === 'suspended').length}
          tone="bad"
          method="Suspension blocks new schedules, hides the holder from sale and blocks driver shift start."
        />
        <Stat
          label="Route permits"
          value={rows.filter((r) => r.type === 'ROUTE').length}
          method="Trayek permits held across all operators."
        />
      </StatGrid>

      <DataTable
        columns={[
          {
            key: 'id',
            header: 'Permit',
            width: 160,
            render: (r) => <span className="font-mono text-[12.5px]">{r.id}</span>,
          },
          { key: 'typeLabel', header: 'Type' },
          { key: 'holderName', header: 'Holder' },
          { key: 'routeLabel', header: 'Scope', render: (r) => r.routeLabel || r.terms?.class || '—' },
          { key: 'issued', header: 'Issued', render: (r) => dateOnly(r.issued) },
          {
            key: 'expiry',
            header: 'Expiry',
            render: (r) => (
              <span className={r.days <= 30 ? 'text-amber-700 font-medium' : ''}>
                {dateOnly(r.expiry)}
                {r.days > 0 && r.days <= 90 ? ` · ${r.days}d` : ''}
              </span>
            ),
          },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          {
            key: '_a',
            header: '',
            sortable: false,
            align: 'right',
            render: (r) => (
              <Button size="xs" variant="subtle" icon={ScanLine} as={Link} to={`/verify/${r.id}`}>
                Verify
              </Button>
            ),
          },
        ]}
        rows={rows}
        searchKeys={['id', 'holderName', 'typeLabel', 'routeLabel']}
        filters={[
          { key: 'type', label: 'Type', options: licenceTypes.map((t) => ({ value: t.code, label: t.label })) },
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'valid', label: 'Valid' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'pending', label: 'Pending' },
            ],
          },
        ]}
        exportName="permit-register"
        pageSize={14}
      />
    </>
  )
}
