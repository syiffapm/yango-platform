import { Link } from 'react-router-dom'
import { FilePlus2, ScanLine, ScrollText } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import useOperator from '../useOperator.js'
import { dateOnly, daysUntil } from '../../../lib/format.js'
import { licenceTypes } from '../../../data/org.js'
export default function Licences() {
  const { permits, db, op } = useOperator()
  const rows = permits.map((p) => ({
    ...p,
    typeLabel: licenceTypes.find((t) => t.code === p.type)?.label || p.type,
    days: daysUntil(p.expiry),
  }))
  const apps = db.applications.filter((a) => a.operator === op.id && !['approved', 'rejected'].includes(a.state))
  return (
    <>
      <PageHeader
        title="Licences"
        subtitle="Every company, vehicle, route and driver licence with its status. Applications and renewals are filed in the Licensing Portal and flow straight back here."
        actions={
          <Button variant="primary" icon={FilePlus2} as={Link} to="/licensing/apply">
            New application
          </Button>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Permits held"
          value={rows.length}
          icon={ScrollText}
          method="Every permit issued to your company or its vehicles and drivers."
        />
        <Stat
          label="Valid"
          value={rows.filter((r) => r.status === 'valid').length}
          tone="good"
          method="In force today."
        />
        <Stat
          label="Expiring ≤ 90 days"
          value={rows.filter((r) => r.days <= 90 && r.days > 0).length}
          tone="warn"
          method="Reminders at 90/60/30/7 days."
        />
        <Stat label="Applications in flight" value={apps.length} method="Filed but not yet approved or rejected." />
      </StatGrid>

      {apps.length > 0 && (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3.5">
          <p className="text-[12.5px] font-medium text-sky-900 mb-2">Applications in progress</p>
          <div className="flex flex-wrap gap-2">
            {apps.map((a) => (
              <Link
                key={a.id}
                to={`/licensing/application/${a.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-sky-200 px-2.5 py-1.5 hover:border-sky-400"
              >
                <span className="text-[12.5px] text-ink-800">{a.typeLabel}</span>
                <StatusPill status={a.state} />
              </Link>
            ))}
          </div>
        </div>
      )}

      <DataTable
        columns={[
          { key: 'id', header: 'Permit', render: (r) => <span className="font-mono text-[12.5px]">{r.id}</span> },
          { key: 'typeLabel', header: 'Type' },
          { key: 'holderName', header: 'Holder' },
          { key: 'routeLabel', header: 'Scope', render: (r) => r.routeLabel || r.terms?.class || '—' },
          {
            key: 'expiry',
            header: 'Expiry',
            render: (r) => (
              <span className={r.days <= 90 && r.days > 0 ? 'text-amber-700 font-medium' : ''}>
                {dateOnly(r.expiry)}
              </span>
            ),
          },
          {
            key: 'days',
            header: 'Days left',
            align: 'right',
            render: (r) => <Badge tone={r.days < 0 ? 'red' : r.days <= 30 ? 'amber' : 'slate'}>{r.days}</Badge>,
          },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          {
            key: '_a',
            header: '',
            sortable: false,
            align: 'right',
            render: (r) => (
              <div className="flex justify-end gap-1">
                <Button size="xs" icon={ScanLine} as={Link} to={`/verify/${r.id}`}>
                  Verify
                </Button>
                {r.days <= 90 && (
                  <Button size="xs" variant="primary" as={Link} to="/licensing/renewals">
                    Renew
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        rows={rows}
        searchKeys={['id', 'holderName', 'typeLabel']}
        filters={[
          { key: 'type', label: 'Type', options: licenceTypes.map((t) => ({ value: t.code, label: t.label })) },
        ]}
        exportName="licences"
        pageSize={12}
      />
    </>
  )
}
