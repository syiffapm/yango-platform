import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import useAuthority from '../useAuthority.js'
import { dt, relative } from '../../../lib/format.js'
import { FileText, ShieldCheck } from 'lucide-react'
export default function AuditLog() {
  const { db } = useAuthority()
  const rows = db.audit.map((a) => ({
    ...a,
    actorName:
      db.users.find((u) => u.id === a.actor)?.name ||
      (db.operators || []).find((o) => o.id === a.actor)?.name ||
      db.drivers.find((d) => d.id === a.actor)?.name ||
      a.actor,
    roleLabel: db.roles.find((r) => r.id === a.role)?.label || a.role,
  }))
  const flagged = rows.filter((r) => r.flag)
  return (
    <>
      <PageHeader
        title="Audit log"
        subtitle="Append-only and hash-chained. Who did what, to which object, and with what written reason. Where a reason was required and none was recorded, the entry is flagged rather than hidden."
        meta={
          <>
            <Badge tone="brand" icon={ShieldCheck}>
              Append-only · tamper evident
            </Badge>
            <Badge tone="slate">{rows.length} entries</Badge>
          </>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Entries"
          value={rows.length}
          icon={FileText}
          method="Every create, update, approval, export and sign-in in the retained window."
        />
        <Stat
          label="With a written reason"
          value={rows.filter((r) => r.reason).length}
          tone="good"
          method="Actions that carried the reason the rule required."
        />
        <Stat
          label="Reason missing"
          value={flagged.length}
          tone={flagged.length ? 'warn' : 'good'}
          method="Actions where a reason was required but none was captured. Surfaced, never deleted."
        />
        <Stat
          label="Categories"
          value={new Set(rows.map((r) => r.category)).size}
          method="Incidents, Compliance, Exports, Administration and Access."
        />
      </StatGrid>

      <DataTable
        columns={[
          { key: 'at', header: 'When', render: (r) => <span title={dt(r.at)}>{relative(r.at)}</span> },
          { key: 'actorName', header: 'Actor' },
          { key: 'roleLabel', header: 'Role', render: (r) => <Badge tone="slate">{r.roleLabel}</Badge> },
          { key: 'action', header: 'Action' },
          { key: 'object', header: 'Object' },
          { key: 'category', header: 'Category', render: (r) => <Badge tone="brand">{r.category}</Badge> },
          {
            key: 'reason',
            header: 'Written reason',
            className: 'max-w-md',
            render: (r) =>
              r.reason ? (
                <span className="text-[12.5px] text-ink-600">“{r.reason}”</span>
              ) : r.flag ? (
                <Badge tone="red">{r.flag}</Badge>
              ) : (
                <span className="text-ink-300">—</span>
              ),
          },
        ]}
        rows={rows}
        exportName="audit-log"
        searchKeys={['actorName', 'action', 'object', 'reason']}
        filters={[
          {
            key: 'category',
            label: 'Category',
            options: [...new Set(rows.map((r) => r.category))].map((c) => ({ value: c, label: c })),
          },
        ]}
        pageSize={16}
      />

      <Card className="mt-4">
        <CardBody className="flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-brand-600 mt-px shrink-0" />
          <p className="text-[12px] text-ink-600 leading-relaxed">
            Entries are hash-chained: each record carries a digest of the one before it, so a deletion or edit anywhere
            in the chain is detectable. The national auditor has read access to the whole log; every other role reads
            only its own lines.
          </p>
        </CardBody>
      </Card>
    </>
  )
}
