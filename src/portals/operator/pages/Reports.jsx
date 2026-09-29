import { useState } from 'react'
import { FileBarChart, Download, Calendar } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import { Checkbox, Field, Select } from '../../../components/ui/Field.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import CoverageChip from '../../../components/domain/CoverageChip.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import { coverageIndex } from '../../../lib/store.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { dt } from '../../../lib/format.js'
const SECTIONS = [
  'Operations summary',
  'Revenue & settlement',
  'Load factor',
  'On-time performance',
  'Driver performance',
  'Incidents & safety',
]
export default function Reports() {
  const { db, op, audit } = useOperator()
  const toast = useToast()
  const cov = coverageIndex(db, op.id)
  const [sections, setSections] = useState(SECTIONS.slice(0, 4))
  const [period, setPeriod] = useState('This month')
  const [format, setFormat] = useState('PDF')
  const [exporting, setExporting] = useState(false)
  const library = [
    {
      id: 'R-12',
      name: 'PO operational report (own fleet)',
      period: 'Daily',
      built: dt(new Date(Date.now() - 3600000).toISOString()),
      coverage: `${cov.pct}%`,
      status: 'Ready',
    },
    {
      id: 'R-07',
      name: 'Revenue, levy and settlement',
      period: 'Monthly',
      built: dt(new Date(Date.now() - 86400000).toISOString()),
      coverage: `${cov.pct}%`,
      status: 'Ready',
    },
    {
      id: 'R-01',
      name: 'Service compliance (your lines)',
      period: 'Monthly',
      built: dt(new Date(Date.now() - 4 * 86400000).toISOString()),
      coverage: '46%',
      status: 'Withheld',
    },
    {
      id: 'R-11',
      name: 'Passenger experience',
      period: 'Monthly',
      built: dt(new Date(Date.now() - 6 * 86400000).toISOString()),
      coverage: `${cov.pct}%`,
      status: 'Ready',
    },
  ]
  const doExport = (reason) => {
    audit({
      actor: op.id,
      role: 'po_admin',
      action: 'Exported per-line figures',
      object: `${period} · ${sections.length} sections`,
      reason,
      category: 'Exports',
    })
    toast({ title: 'Report generated', body: `Coverage ${cov.pct}% is stamped on the cover and cannot be edited out.` })
    setExporting(false)
  }
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Operations, revenue, load factor, on-time, driver performance and incidents. Every export carries the Coverage Index at build time and a method-and-limitations block."
        meta={<CoverageChip coverage={cov} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Report builder" icon={FileBarChart} />
          <CardBody className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Period">
                <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                  {['Today', 'This week', 'This month', 'Last month', 'This quarter'].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Format">
                <Select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option>PDF</option>
                  <option>XLSX</option>
                </Select>
              </Field>
            </div>
            <div>
              <p className="text-[12.5px] font-medium text-ink-600 mb-2">Sections</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {SECTIONS.map((s) => (
                  <Checkbox
                    key={s}
                    label={s}
                    checked={sections.includes(s)}
                    onChange={(e) =>
                      setSections((cur) => (e.target.checked ? [...cur, s] : cur.filter((x) => x !== s)))
                    }
                  />
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-[12.5px] text-amber-900 leading-relaxed">
                Exporting per-line figures requires a written reason, which is recorded in the audit log. Reports are
                withheld entirely when data coverage falls below 20%.
              </p>
            </div>
            <Button
              variant="primary"
              icon={Download}
              onClick={() => setExporting(true)}
              disabled={sections.length === 0}
            >
              Generate {format}
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Scheduled deliveries" icon={Calendar} />
          <CardBody className="space-y-2">
            {[
              ['Daily operations', '06:00 every day', 'ops@' + op.short.toLowerCase() + '.mm'],
              ['Weekly settlement', 'Monday 08:00', 'finance@' + op.short.toLowerCase() + '.mm'],
            ].map(([n, w, to]) => (
              <div key={n} className="rounded-lg border border-ink-200 p-3">
                <p className="text-[12.5px] font-medium text-ink-900">{n}</p>
                <p className="text-[12px] text-ink-500">
                  {w} · {to}
                </p>
                <Badge tone="green" className="mt-1.5">
                  Active
                </Badge>
              </div>
            ))}
            <p className="text-[11.5px] text-ink-400 leading-relaxed pt-1">
              Recipients are office mailboxes, not named individuals.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Library"
          subtitle="Generated reports keep the thresholds and coverage they were built with."
        />
        <CardBody className="p-0">
          <DataTable
            search={false}
            columns={[
              { key: 'id', header: 'Code' },
              { key: 'name', header: 'Report' },
              { key: 'period', header: 'Frequency' },
              { key: 'built', header: 'Built' },
              { key: 'coverage', header: 'Coverage at build' },
              {
                key: 'status',
                header: 'Status',
                render: (r) => <Badge tone={r.status === 'Ready' ? 'green' : 'slate'}>{r.status}</Badge>,
              },
              {
                key: '_a',
                header: '',
                sortable: false,
                align: 'right',
                render: (r) =>
                  r.status === 'Ready' ? (
                    <Button size="xs" icon={Download}>
                      Download
                    </Button>
                  ) : (
                    <span className="text-[12px] text-ink-400">coverage &lt; 20%</span>
                  ),
              },
            ]}
            rows={library}
          />
        </CardBody>
      </Card>

      <ReasonDialog
        open={exporting}
        onClose={() => setExporting(false)}
        onConfirm={doExport}
        title="Export per-line figures"
        confirmLabel="Generate report"
        variant="primary"
        subtitle="Say what the export is for. The reason and your name are written to the audit log."
      />
    </>
  )
}
