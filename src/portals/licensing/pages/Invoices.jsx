import { Link } from 'react-router-dom'
import { useLicensingBase } from '../mount.jsx'
import { Receipt } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { MMK, dt } from '../../../lib/format.js'
export default function Invoices() {
  const licBase = useLicensingBase()
  const { db } = useDb()
  const [ses] = useSession('licensing')
  const rows = db.invoices.filter((i) => i.party === ses.operator)
  const unpaid = rows.filter((i) => i.status === 'unpaid')
  return (
    <>
      <PageHeader
        title="Invoices & receipts"
        subtitle="Invoices are issued automatically on submission; payment produces a numbered, digitally signed e-receipt posted to the treasury account."
      />
      <StatGrid cols={3} className="mb-5">
        <Stat
          label="Outstanding"
          value={MMK(unpaid.reduce((s, i) => s + i.amount, 0))}
          tone={unpaid.length ? 'warn' : 'good'}
          icon={Receipt}
          method="Invoices issued but not yet settled."
        />
        <Stat
          label="Paid this register"
          value={MMK(rows.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0))}
          method="Settled licence fees and fines."
        />
        <Stat label="Invoices" value={rows.length} method="All invoices addressed to your company." />
      </StatGrid>
      <DataTable
        columns={[
          { key: 'id', header: 'Invoice', render: (r) => <span className="font-mono text-[12.5px]">{r.id}</span> },
          { key: 'kind', header: 'Kind' },
          { key: 'ref', header: 'Reference' },
          { key: 'amount', header: 'Amount', align: 'right', render: (r) => MMK(r.amount) },
          { key: 'issuedAt', header: 'Issued', render: (r) => dt(r.issuedAt) },
          { key: 'method', header: 'Method', render: (r) => r.method || '—' },
          { key: 'receiptNo', header: 'e-Receipt', render: (r) => r.receiptNo || '—' },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          {
            key: '_a',
            header: '',
            sortable: false,
            align: 'right',
            render: (r) =>
              r.status === 'unpaid' && r.kind === 'licence' ? (
                <Button size="xs" variant="primary" as={Link} to={`${licBase}/application/${r.ref}`}>
                  Pay
                </Button>
              ) : null,
          },
        ]}
        rows={rows}
        exportName="invoices"
        empty="No invoices for this operator"
      />
    </>
  )
}
