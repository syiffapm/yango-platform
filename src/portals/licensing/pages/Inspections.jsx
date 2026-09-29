import { useNavigate } from 'react-router-dom'
import { useLicensingBase } from '../mount.jsx'
import { CalendarClock } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { useDb } from '../../../lib/store.jsx'
import { dt } from '../../../lib/format.js'
export default function Inspections() {
  const licBase = useLicensingBase()
  const { db } = useDb()
  const nav = useNavigate()
  const rows = db.applications
    .filter((a) => a.inspection)
    .map((a) => ({
      id: a.id,
      type: a.typeLabel,
      applicant: a.applicantName,
      scheduledAt: a.inspection.scheduledAt,
      inspector: db.users.find((u) => u.id === a.inspection.inspector)?.name || '—',
      location: a.inspection.location,
      result: a.inspection.result || 'pending',
    }))
  return (
    <>
      <PageHeader
        title="Inspections"
        subtitle="Ramp checks and roadworthiness inspections with slot booking, inspector assignment and photo evidence on the result."
      />
      <DataTable
        columns={[
          { key: 'id', header: 'Application' },
          { key: 'type', header: 'Licence type' },
          { key: 'applicant', header: 'Applicant' },
          { key: 'scheduledAt', header: 'Slot', render: (r) => dt(r.scheduledAt) },
          { key: 'inspector', header: 'Inspector' },
          { key: 'location', header: 'Location' },
          { key: 'result', header: 'Result', render: (r) => <StatusPill status={r.result} /> },
          {
            key: '_a',
            header: '',
            sortable: false,
            align: 'right',
            render: (r) => (
              <Button size="xs" variant="subtle" onClick={() => nav(`${licBase}/application/${r.id}`)}>
                Open
              </Button>
            ),
          },
        ]}
        rows={rows}
        exportName="inspections"
        empty="No inspections booked"
        toolbar={
          <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-500">
            <CalendarClock size={13} />
            {rows.filter((r) => r.result === 'pending').length} pending
          </span>
        }
      />
    </>
  )
}
