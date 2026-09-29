import { useState } from 'react'
import { Calendar, Download, FileBarChart, Pause, Play } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Checkbox, Field, Select } from '../../../components/ui/Field.jsx'
import CoverageChip from '../../../components/domain/CoverageChip.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import { coverageIndex } from '../../../lib/store.jsx'
import useAuthority from '../useAuthority.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { dt } from '../../../lib/format.js'
const CATALOGUE = [
  { code: 'R-01', name: 'Service compliance', freq: 'Monthly', audience: 'Licensing committee' },
  { code: 'R-02', name: 'Incident and safety summary', freq: 'Weekly', audience: 'Safety & operations' },
  { code: 'R-03', name: 'Coverage and data quality', freq: 'Weekly', audience: 'Console operations' },
  { code: 'R-04', name: 'Ridership and demand', freq: 'Monthly', audience: 'Planning directorate' },
  { code: 'R-05', name: 'Network performance brief', freq: 'Quarterly', audience: "Board and Minister's office" },
  { code: 'R-06', name: 'Licensing activity and SLA', freq: 'Monthly', audience: 'Licensing department' },
  {
    code: 'R-07',
    name: 'Regulated revenue, levy and settlement',
    freq: 'Daily / monthly',
    audience: 'Finance, treasury',
  },
  { code: 'R-08', name: 'Driver and fleet status', freq: 'Monthly', audience: 'Licensing, safety' },
  { code: 'R-09', name: 'SOS response performance', freq: 'Weekly', audience: 'Safety, police liaison' },
  { code: 'R-10', name: 'Advertising performance and revenue', freq: 'Monthly', audience: 'Authority finance, POs' },
  { code: 'R-11', name: 'Passenger experience', freq: 'Monthly', audience: 'Authority, POs' },
  { code: 'R-12', name: 'PO operational report', freq: 'Daily / weekly', audience: 'Each PO' },
]

/**
 * What a ministry actually asks for, as opposed to an operational report: a
 * performance pack against published targets, the money, and the enforcement
 * record — each with the office that owns it and the cadence it is tabled at.
 */
const MINISTRY_PACK = [
  {
    code: 'MP-01',
    name: 'Monthly sector performance pack',
    cadence: 'Monthly',
    owner: "Minister's office",
    contents:
      'Service delivery against the ten published objectives, exceptions with a named owner, and what changed since last month',
    scope: 'National + per region',
  },
  {
    code: 'MP-02',
    name: 'Quarterly board brief',
    cadence: 'Quarterly',
    owner: 'Board and Ministry',
    contents:
      'Network performance, coverage and accessibility, passenger satisfaction, and the corridor investment case',
    scope: 'National',
  },
  {
    code: 'MP-03',
    name: 'Non-tax revenue and treasury reconciliation',
    cadence: 'Monthly',
    owner: 'Finance and Treasury',
    contents: 'Levy, licence fees, fines and advertising revenue; 3-way reconciliation status and exceptions',
    scope: 'National + per region',
  },
  {
    code: 'MP-04',
    name: 'Safety and incident account',
    cadence: 'Monthly',
    owner: 'Safety directorate, police liaison',
    contents:
      'SOS volume and response against SLA, incidents per 100k journeys, accidents, and open enforcement actions',
    scope: 'National + per region',
  },
  {
    code: 'MP-05',
    name: 'Licensing and compliance record',
    cadence: 'Monthly',
    owner: 'Licensing committee',
    contents:
      'Applications and SLA, approvals and refusals with reasons, findings issued, disputes ruled, sanctions in force',
    scope: 'National + per region',
  },
  {
    code: 'MP-06',
    name: 'Operator scorecard',
    cadence: 'Quarterly',
    owner: 'Licensing committee',
    contents:
      'Every operator ranked on coverage, reliability, safety and passenger rating, with permits due for renewal',
    scope: 'Per region',
  },
  {
    code: 'MP-07',
    name: 'Fare policy and affordability review',
    cadence: 'Quarterly',
    owner: 'Policy directorate',
    contents:
      'Where operators sit inside each fare band, fare changes in the period, and affordability against the basket',
    scope: 'National',
  },
  {
    code: 'MP-08',
    name: 'Digital adoption and inclusion',
    cadence: 'Quarterly',
    owner: 'Policy directorate',
    contents:
      'Share of tickets sold digitally, cash-on-board residual, accessibility usage, and coverage of the unbanked',
    scope: 'National',
  },
  {
    code: 'MP-09',
    name: 'Data quality and coverage statement',
    cadence: 'Monthly',
    owner: 'Ministry statistician',
    contents: 'Coverage Index by region, what could not be measured and why, and the disclosure floors applied',
    scope: 'National + per region',
  },
  {
    code: 'MP-10',
    name: 'Annual sector review',
    cadence: 'Annual',
    owner: 'Ministry, published',
    contents: 'Everything above for the year, with the method-and-limitations statement and the open-data release',
    scope: 'National',
  },
]
const MINISTRY_TARGETS = [
  { objective: 'O1 Licence applications submitted online', actual: 92, target: 90, unit: '%' },
  { objective: 'O2 Median application-to-approval time', actual: 4.2, target: 5, unit: ' days', lowerBetter: true },
  { objective: 'O3 Fees and fines reconciled daily', actual: 100, target: 100, unit: '%' },
  { objective: 'O4 Coverage Index', actual: 84, target: 85, unit: '%' },
  { objective: 'O5 Headway adherence (urban)', actual: 81, target: 85, unit: '%' },
  { objective: 'O6 SOS acknowledged within SLA', actual: 96, target: 95, unit: '%' },
  { objective: 'O7 Tickets sold digitally (urban)', actual: 38, target: 40, unit: '%' },
  { objective: 'O8 Average trip rating', actual: 4.1, target: 4.0, unit: ' / 5' },
  { objective: 'O9 Findings answered within SLA', actual: 88, target: 90, unit: '%' },
  { objective: 'O10 Unserved searches on top corridors', actual: -18, target: -30, unit: '%' },
]
const SECTIONS = [
  'Executive summary',
  'Coverage & data quality',
  'Compliance by line',
  'Incidents & SOS',
  'Ridership & demand',
  'Revenue & settlement',
  'Method and limitations',
]
export default function Reports() {
  const { db, audit } = useAuthority()
  const toast = useToast()
  const cov = coverageIndex(db)
  const [code, setCode] = useState('R-01')
  const [period, setPeriod] = useState('This month')
  const [format, setFormat] = useState('PDF')
  const [sections, setSections] = useState(SECTIONS.slice(0, 5).concat(['Method and limitations']))
  const [exporting, setExporting] = useState(false)
  const [tab, setTab] = useState('ministry')
  const [scope, setScope] = useState('National')
  const [schedules, setSchedules] = useState([
    { id: 1, name: 'R-02 Incident & safety', when: 'Monday 07:00', to: 'safety.office@yrtc.gov.mm', active: true },
    { id: 2, name: 'R-03 Coverage & data quality', when: 'Friday 16:00', to: 'console.ops@yrtc.gov.mm', active: true },
    {
      id: 3,
      name: 'R-05 Network performance brief',
      when: 'Quarterly',
      to: 'minister.office@transport.gov.mm',
      active: false,
    },
  ])
  const library = [
    {
      id: 'L1',
      code: 'R-01',
      period: 'Aug 2026',
      built: dt(new Date(Date.now() - 4 * 86400000).toISOString()),
      by: 'Daw Nwe Ni Aung',
      coverage: '87%',
      status: 'Ready',
      downloads: 14,
    },
    {
      id: 'L2',
      code: 'R-02',
      period: 'Week 38',
      built: dt(new Date(Date.now() - 86400000).toISOString()),
      by: 'Daw Aye Thida',
      coverage: '84%',
      status: 'Ready',
      downloads: 6,
    },
    {
      id: 'L3',
      code: 'R-04',
      period: 'Aug 2026',
      built: dt(new Date(Date.now() - 6 * 86400000).toISOString()),
      by: 'U Kyaw Swar',
      coverage: '46%',
      status: 'Ready',
      downloads: 3,
    },
    {
      id: 'L4',
      code: 'R-01',
      period: 'Jul 2026',
      built: dt(new Date(Date.now() - 34 * 86400000).toISOString()),
      by: 'Daw Nwe Ni Aung',
      coverage: '17%',
      status: 'Withheld',
      downloads: 0,
    },
    {
      id: 'L5',
      code: 'R-07',
      period: 'Yesterday',
      built: dt(new Date(Date.now() - 3600000).toISOString()),
      by: 'Daw Ei Mon',
      coverage: '84%',
      status: 'Ready',
      downloads: 21,
    },
  ]
  const generate = (reason) => {
    audit({
      actor: 'U05',
      role: 'compliance',
      action: 'Generated report',
      object: `${code} · ${period}`,
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
        subtitle="Twelve report types with a builder, a permanent library and scheduled delivery to offices rather than named individuals."
        meta={<CoverageChip coverage={cov} />}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { value: 'ministry', label: 'Ministry pack', count: MINISTRY_PACK.length },
          { value: 'builder', label: 'Report builder' },
          { value: 'library', label: 'Library' },
          { value: 'catalogue', label: 'Operational catalogue', count: CATALOGUE.length },
        ]}
      />

      {tab === 'ministry' && (
        <>
          <StatGrid cols={4} className="mb-4">
            <Stat
              label="Objectives met"
              value={`${MINISTRY_TARGETS.filter((t) => (t.lowerBetter ? t.actual <= t.target : t.actual >= t.target)).length} / ${MINISTRY_TARGETS.length}`}
              tone="good"
              method="Published objectives O1–O10 measured against their 12-month target."
            />
            <Stat
              label="Reporting scope"
              value={scope}
              method="A national pack aggregates every region; a regional pack carries only that jurisdiction and is signed by its head."
            />
            <Stat
              label="Coverage at build"
              value={`${cov.pct}%`}
              tone={cov.pct >= 80 ? 'good' : 'warn'}
              method="Stamped on every page of the pack. Below 20% the pack is withheld rather than published with a caveat."
            />
            <Stat
              label="Next tabling"
              value="Monthly · day 5"
              method="The monthly pack is tabled on the fifth working day; the quarterly brief within ten working days of quarter end."
            />
          </StatGrid>

          <Card className="mb-4">
            <CardHeader
              title="Performance against published objectives"
              subtitle="The first page of every ministry pack: what was promised, what was delivered, and where the gap is."
              action={
                <Select value={scope} onChange={(e) => setScope(e.target.value)} className="w-44">
                  <option>National</option>
                  <option>Yangon Region</option>
                  <option>Mandalay Region</option>
                  <option>Bago Region</option>
                </Select>
              }
            />
            <CardBody className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {MINISTRY_TARGETS.map((t) => {
                const met = t.lowerBetter ? t.actual <= t.target : t.actual >= t.target
                const pct = t.lowerBetter
                  ? Math.min(100, Math.abs(t.target / (t.actual || 1)) * 100)
                  : Math.min(100, (t.actual / t.target) * 100)
                return (
                  <div key={t.objective}>
                    <div className="flex justify-between text-[12.5px] mb-1 gap-3">
                      <span className="text-ink-600">{t.objective}</span>
                      <span
                        className={
                          met
                            ? 'text-emerald-700 font-medium whitespace-nowrap'
                            : 'text-amber-700 font-medium whitespace-nowrap'
                        }
                      >
                        {t.actual}
                        {t.unit} · target {t.target}
                        {t.unit}
                      </span>
                    </div>
                    <Progress value={Math.max(0, pct)} tone={met ? 'green' : 'amber'} />
                  </div>
                )
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Ministry reporting pack"
              subtitle="What the ministry asks for, who owns it and how often it is tabled."
            />
            <CardBody className="p-0">
              <DataTable
                columns={[
                  { key: 'code', header: 'Code', width: 80 },
                  {
                    key: 'name',
                    header: 'Report',
                    render: (r) => <span className="font-medium text-ink-900">{r.name}</span>,
                  },
                  { key: 'cadence', header: 'Cadence', render: (r) => <Badge tone="brand">{r.cadence}</Badge> },
                  { key: 'owner', header: 'Owning office' },
                  { key: 'scope', header: 'Scope', render: (r) => <Badge tone="slate">{r.scope}</Badge> },
                  { key: 'contents', header: 'What it contains', className: 'max-w-md' },
                  {
                    key: '_a',
                    header: '',
                    sortable: false,
                    align: 'right',
                    render: () => (
                      <Button size="xs" icon={Download} onClick={() => setExporting(true)}>
                        Build
                      </Button>
                    ),
                  },
                ]}
                rows={MINISTRY_PACK.map((m) => ({ ...m, id: m.code }))}
                exportName="ministry-pack"
                pageSize={12}
              />
            </CardBody>
          </Card>
        </>
      )}

      {tab === 'builder' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Report builder" icon={FileBarChart} />
            <CardBody className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Report type">
                  <Select value={code} onChange={(e) => setCode(e.target.value)}>
                    {CATALOGUE.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Period">
                  <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                    {['Today', 'This week', 'This month', 'Last month', 'This quarter', 'Last quarter'].map((p) => (
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
                      disabled={s === 'Method and limitations'}
                      hint={
                        s === 'Method and limitations' ? 'Always included — it travels with every export' : undefined
                      }
                      onChange={(e) =>
                        setSections((cur) => (e.target.checked ? [...cur, s] : cur.filter((x) => x !== s)))
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-ink-200 bg-ink-50 p-3.5">
                <p className="text-[12.5px] font-medium text-ink-800 mb-1">Preview — cover stamp</p>
                <p className="text-[12px] text-ink-600 leading-relaxed">
                  {CATALOGUE.find((c) => c.code === code)?.name} · {period} · built {dt(new Date().toISOString())} ·
                  Coverage Index {cov.pct}% ({cov.qualifier}) · thresholds version {db.thresholds.version}.
                  {cov.pct < 20 && ' This report would be withheld — coverage is below 20%.'}
                </p>
              </div>

              <Button variant="primary" icon={Download} onClick={() => setExporting(true)}>
                Generate {format}
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Scheduled deliveries"
              icon={Calendar}
              subtitle="Recipients are offices, never named individuals"
            />
            <CardBody className="space-y-2">
              {schedules.map((s) => (
                <div key={s.id} className="rounded-lg border border-ink-200 p-3">
                  <p className="text-[12.5px] font-medium text-ink-900">{s.name}</p>
                  <p className="text-[12px] text-ink-500">
                    {s.when} · {s.to}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge tone={s.active ? 'green' : 'slate'}>{s.active ? 'Active' : 'Paused'}</Badge>
                    <Button
                      size="xs"
                      icon={s.active ? Pause : Play}
                      onClick={() =>
                        setSchedules((cur) => cur.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)))
                      }
                    >
                      {s.active ? 'Pause' : 'Resume'}
                    </Button>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'library' && (
        <Card>
          <CardHeader
            title="Library"
            subtitle="Published reports keep the thresholds and coverage they were built with."
          />
          <CardBody className="p-0">
            <DataTable
              columns={[
                { key: 'code', header: 'Code' },
                { key: 'period', header: 'Period' },
                { key: 'built', header: 'Built' },
                { key: 'by', header: 'Built by' },
                { key: 'coverage', header: 'Coverage at build' },
                { key: 'downloads', header: 'Downloads', align: 'right' },
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
              exportName="report-library"
            />
          </CardBody>
        </Card>
      )}

      {tab === 'catalogue' && (
        <Card>
          <CardHeader
            title="Operational report catalogue"
            subtitle="Twelve types across compliance, safety, demand, licensing, money, ads and experience"
          />
          <CardBody className="p-0">
            <DataTable
              search={false}
              dense
              columns={[
                { key: 'code', header: 'Code' },
                { key: 'name', header: 'Report' },
                { key: 'freq', header: 'Frequency' },
                { key: 'audience', header: 'Audience' },
              ]}
              rows={CATALOGUE.map((c) => ({ ...c, id: c.code }))}
              pageSize={12}
            />
          </CardBody>
        </Card>
      )}

      <ReasonDialog
        open={exporting}
        onClose={() => setExporting(false)}
        onConfirm={generate}
        title="Generate report"
        confirmLabel="Generate"
        variant="primary"
        subtitle="Reports containing line-level figures need a written reason, recorded against your name in the audit log."
      />
    </>
  )
}
