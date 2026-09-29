import { useState } from 'react'
import { BadgeCheck, Gavel, Paperclip, Scale } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import { NotMeasurable } from '../../../components/domain/CoverageChip.jsx'
import { Pills } from '../../../components/ui/Tabs.jsx'
import useAuthority from '../useAuthority.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dt, relative } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
const DIMS = ['coverage', 'operating_hours', 'frequency', 'route_coverage', 'fleet_availability', 'service_standard']
const LABEL = {
  coverage: 'Coverage',
  operating_hours: 'Operating hours',
  frequency: 'Frequency',
  route_coverage: 'Route coverage',
  fleet_availability: 'Fleet availability',
  service_standard: 'Service standard',
  on_time_departure: 'On-time departure',
  on_time_arrival: 'On-time arrival',
  trip_completion: 'Trip completion',
  route_adherence: 'Route adherence',
}
export default function Compliance() {
  const { db, update, audit, notify, me, can } = useAuthority()
  const toast = useToast()
  const [tab, setTab] = useState('matrix')
  const [filter, setFilter] = useState('all')
  const [issuing, setIssuing] = useState(null)
  const [ruling, setRuling] = useState(null) // { finding, outcome }
  const floors = db.thresholds.coverageFloors
  const rows = db.compliance.filter((c) => {
    if (filter === 'breach') return c.dimensions.some((d) => d.measurable && d.breach)
    if (filter === 'nm') return c.dimensions.some((d) => !d.measurable)
    if (filter === 'brt') return routes.find((r) => r.id === c.route)?.class === 'BRT'
    if (filter === 'finding') return db.findings.some((f) => f.route === c.route)
    return true
  })
  const compliant = db.compliance.filter((c) => c.dimensions.filter((d) => d.measurable).every((d) => !d.breach)).length
  const inBreach = db.compliance.filter((c) => c.dimensions.some((d) => d.measurable && d.breach)).length
  const notMeasurable = db.compliance.filter((c) => c.coveragePct < floors.censusFloor).length
  const issueFinding = (reason) => {
    const id = `FND-${4500 + db.findings.length}`
    const route = routes.find((r) => r.id === issuing.route)
    update((d) => {
      d.findings.unshift({
        id,
        route: issuing.route,
        operator: route.operator,
        dimension: issuing.dim.key,
        measured: issuing.dim.measured,
        required: issuing.dim.required,
        issuedBy: me.id,
        issuedAt: new Date().toISOString(),
        reason,
        status: 'issued',
        dispute: null,
        ruling: null,
        sanction: null,
      })
    })
    audit({
      actor: me.id,
      role: me.role,
      action: 'Issued finding',
      object: `${id} · ${route.line}`,
      reason,
      category: 'Compliance',
    })
    notify({
      audience: 'operator',
      title: `Finding issued — ${id}`,
      body: `${LABEL[issuing.dim.key]} on ${route.line}. You have 14 days to reply or dispute with evidence.`,
    })
    toast({ title: 'Finding issued', body: 'The operator has been notified and may dispute with evidence.' })
    setIssuing(null)
  }
  const rule = (reason) => {
    const { finding, outcome } = ruling
    update((d) => {
      const f = d.findings.find((x) => x.id === finding.id)
      f.status = outcome === 'uphold' ? 'upheld' : 'withdrawn'
      f.ruling = { at: new Date().toISOString(), by: me.id, outcome, reason }
      if (outcome === 'uphold')
        f.sanction = {
          type: 'fine',
          amount: 1_000_000,
          invoiceId: `INV-F-${9100 + d.invoices.length}`,
          status: 'unpaid',
        }
    })
    audit({
      actor: me.id,
      role: me.role,
      action: `Ruled on dispute — ${outcome}`,
      object: finding.id,
      reason,
      category: 'Compliance',
    })
    notify({
      audience: 'operator',
      title: `Dispute ruled — ${finding.id}`,
      body: `${outcome === 'uphold' ? 'Finding upheld' : 'Finding withdrawn'}: ${reason}`,
    })
    toast({ title: `Dispute ${outcome === 'uphold' ? 'upheld' : 'withdrawn'}` })
    setRuling(null)
  }
  const disputes = db.findings.filter((f) => f.status === 'disputed')
  return (
    <>
      <PageHeader
        title="Compliance"
        subtitle="The matrix measures; a named officer decides. Where data coverage is below the census floor the dimension reads “not measurable”, never “failed”."
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Compliant today"
          value={`${Math.round((compliant / Math.max(1, db.compliance.length)) * 100)}%`}
          tone="good"
          method="Lines where every measurable dimension sits within the threshold in force for its service class."
        />
        <Stat
          label="In breach"
          value={inBreach}
          tone={inBreach ? 'warn' : 'good'}
          method="Lines with at least one measurable dimension outside the threshold. A breach is not yet a finding."
        />
        <Stat
          label="Not measurable"
          value={notMeasurable}
          tone="muted"
          method={`Lines with coverage below the census floor of ${floors.censusFloor}%. Shown as not measurable, never as failure.`}
        />
        <Stat
          label="Findings issued"
          value={db.findings.length}
          icon={BadgeCheck}
          method="Formal notices that a measured breach is being acted on, each with a written reason."
        />
      </StatGrid>

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { value: 'matrix', label: 'Compliance matrix', count: db.compliance.length },
          { value: 'findings', label: 'Findings', count: db.findings.length },
          { value: 'disputes', label: 'Disputes', count: disputes.length },
          { value: 'thresholds', label: 'Thresholds in force' },
        ]}
      />

      {tab === 'matrix' && (
        <Card>
          <CardHeader
            title="Matrix per line"
            subtitle="Coverage, operating hours, frequency, route coverage, fleet availability and service standard."
            action={
              <Pills
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'breach', label: 'In breach' },
                  { value: 'nm', label: 'Not measurable' },
                  { value: 'brt', label: 'BRT' },
                  { value: 'finding', label: 'Has finding' },
                ]}
              />
            }
          />
          <CardBody className="p-0 overflow-x-auto scroll-thin">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="px-4 py-2.5 text-[11.5px] uppercase tracking-wider text-ink-400">Line</th>
                  <th className="px-4 py-2.5 text-[11.5px] uppercase tracking-wider text-ink-400">Operator</th>
                  {DIMS.map((d) => (
                    <th key={d} className="px-3 py-2.5 text-[11.5px] uppercase tracking-wider text-ink-400">
                      {LABEL[d]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const route = routes.find((r) => r.id === c.route)
                  const op = (db.operators || []).find((o) => o.id === c.operator)
                  return (
                    <tr key={c.route} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12.5px] font-medium text-ink-900">{route?.line}</span>
                          {route?.class === 'BRT' && <Badge tone="brand">BRT</Badge>}
                        </div>
                        <span className="block text-[11.5px] text-ink-400 truncate max-w-[160px]">{route?.name}</span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-ink-600">{op?.short}</td>
                      {DIMS.map((key) => {
                        const d = c.dimensions.find((x) => x.key === key)
                        if (!d)
                          return (
                            <td key={key} className="px-3 py-3 text-[12.5px] text-ink-300">
                              n/a
                            </td>
                          )
                        if (!d.measurable)
                          return (
                            <td key={key} className="px-3 py-3">
                              <NotMeasurable />
                            </td>
                          )
                        return (
                          <td key={key} className="px-3 py-3">
                            <span
                              className={`text-[12px] font-medium ${d.breach ? 'text-red-600' : 'text-emerald-700'}`}
                            >
                              {d.measured}
                              {d.unit.includes('%') ? '%' : 'm'}
                            </span>
                            <span className="block text-[11px] text-ink-400">
                              req {d.required}
                              {d.unit.includes('%') ? '%' : 'm'}
                            </span>
                            {d.breach && can.issueFinding && (
                              <button
                                onClick={() => setIssuing({ route: c.route, dim: d })}
                                className="text-[11px] text-brand-700 underline mt-0.5"
                              >
                                Issue finding
                              </button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {tab === 'findings' && (
        <div className="space-y-3">
          {db.findings.map((f) => {
            const route = routes.find((r) => r.id === f.route)
            const op = (db.operators || []).find((o) => o.id === f.operator)
            return (
              <Card key={f.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink-900">{f.id}</span>
                        <StatusPill status={f.status} />
                        <Badge tone="slate">{route?.line}</Badge>
                        <Badge tone="slate">{op?.short}</Badge>
                      </div>
                      <p className="text-[12px] text-ink-600 mt-1">
                        {LABEL[f.dimension]} — measured {f.measured} against {f.required} · issued by{' '}
                        {db.users.find((u) => u.id === f.issuedBy)?.name} {relative(f.issuedAt)}
                      </p>
                    </div>
                    {f.status === 'disputed' && can.ruleDispute && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setRuling({ finding: f, outcome: 'withdraw' })}>
                          Withdraw
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={Scale}
                          onClick={() => setRuling({ finding: f, outcome: 'uphold' })}
                        >
                          Uphold
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 rounded-lg bg-ink-50 border border-ink-100 p-3">
                    <p className="text-[11.5px] uppercase tracking-wider text-ink-400 mb-1">Written reason</p>
                    <p className="text-[12.5px] text-ink-800 leading-relaxed">“{f.reason}”</p>
                  </div>

                  {f.dispute && (
                    <div className="mt-2 rounded-lg bg-sky-50 border border-sky-200 p-3">
                      <p className="text-[11.5px] uppercase tracking-wider text-sky-700 mb-1">Operator dispute</p>
                      <p className="text-[12.5px] text-sky-900 leading-relaxed">“{f.dispute.reason}”</p>
                      {f.dispute.evidence?.length > 0 && (
                        <p className="text-[11.5px] text-sky-700/80 mt-1.5 inline-flex items-center gap-1">
                          <Paperclip size={11} />
                          {f.dispute.evidence.join(', ')}
                        </p>
                      )}
                    </div>
                  )}

                  {f.ruling && (
                    <div
                      className={`mt-2 rounded-lg border p-3 ${f.ruling.outcome === 'uphold' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}
                    >
                      <p className="text-[11.5px] uppercase tracking-wider text-ink-500 mb-1">
                        Ruling — {f.ruling.outcome} · {db.users.find((u) => u.id === f.ruling.by)?.name}
                      </p>
                      <p className="text-[12.5px] text-ink-800 leading-relaxed">“{f.ruling.reason}”</p>
                      <p className="text-[11.5px] text-ink-400 mt-1.5">{dt(f.ruling.at)}</p>
                    </div>
                  )}

                  {f.sanction && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone="red">Sanction: {f.sanction.type}</Badge>
                      {f.sanction.amount > 0 && <Badge tone="amber">{MMK(f.sanction.amount)}</Badge>}
                      {f.sanction.invoiceId && <Badge tone="slate">{f.sanction.invoiceId}</Badge>}
                      <StatusPill status={f.sanction.status} />
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })}
          {db.findings.length === 0 && (
            <Empty
              title="No findings issued"
              hint="Issue one from the matrix where a measurable dimension is in breach."
            />
          )}
        </div>
      )}

      {tab === 'disputes' && (
        <div className="space-y-3">
          {disputes.map((f) => (
            <Card key={f.id}>
              <CardHeader
                title={`${f.id} · ${routes.find((r) => r.id === f.route)?.line}`}
                subtitle={`Disputed ${relative(f.dispute.at)} by ${(db.operators || []).find((o) => o.id === f.operator)?.name}`}
                icon={Gavel}
                action={
                  can.ruleDispute ? (
                    <>
                      <Button size="sm" onClick={() => setRuling({ finding: f, outcome: 'withdraw' })}>
                        Withdraw
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setRuling({ finding: f, outcome: 'uphold' })}>
                        Uphold
                      </Button>
                    </>
                  ) : (
                    <Badge tone="amber">Adjudicator only</Badge>
                  )
                }
              />
              <CardBody className="space-y-2">
                <div className="rounded-lg bg-ink-50 border border-ink-100 p-3">
                  <p className="text-[11.5px] uppercase tracking-wider text-ink-400 mb-1">Finding</p>
                  <p className="text-[12.5px] text-ink-800">“{f.reason}”</p>
                </div>
                <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                  <p className="text-[11.5px] uppercase tracking-wider text-sky-700 mb-1">Operator's case</p>
                  <p className="text-[12.5px] text-sky-900">“{f.dispute.reason}”</p>
                </div>
                <p className="text-[12px] text-ink-400">
                  {' '}
                  the adjudicator must not be the officer who issued the finding (
                  {db.users.find((u) => u.id === f.issuedBy)?.name}).
                </p>
              </CardBody>
            </Card>
          ))}
          {disputes.length === 0 && <Empty title="No open disputes" />}
        </div>
      )}

      {tab === 'thresholds' && (
        <Card>
          <CardHeader
            title="Thresholds in force"
            subtitle={`Version ${db.thresholds.version} · changes apply from the moment they are saved and never rewrite issued findings.`}
          />
          <CardBody className="p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink-100">
                  {['Service class', 'Minimum headway', 'Slack', 'On-time target'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[11.5px] uppercase tracking-wider text-ink-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {db.thresholds.serviceStandards.map((s) => (
                  <tr key={s.class} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-2.5 text-[12.5px] font-medium text-ink-900">{s.class}</td>
                    <td className="px-4 py-2.5 text-[12.5px] text-ink-700">
                      {s.headwayMin ? `${s.headwayMin} min` : 'Timetabled'}
                    </td>
                    <td className="px-4 py-2.5 text-[12.5px] text-ink-700">
                      {s.slackPct != null ? `${s.slackPct}%` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[12.5px] text-ink-700">{s.onTimePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-ink-100 flex flex-wrap gap-2">
              <Badge tone="slate">Spare ratio {db.thresholds.spareRatio}×</Badge>
              <Badge tone="slate">Census floor {floors.censusFloor}%</Badge>
              <Badge tone="slate">k-anonymity {db.thresholds.kAnonymity}</Badge>
              <Badge tone="slate">
                Coverage floors {floors.full}/{floors.indicative}/{floors.warning}%
              </Badge>
            </div>
          </CardBody>
        </Card>
      )}

      <ReasonDialog
        open={!!issuing}
        onClose={() => setIssuing(null)}
        onConfirm={issueFinding}
        title="Issue a finding"
        confirmLabel="Issue finding"
        variant="danger"
        minLength={25}
        subtitle={
          issuing
            ? `${routes.find((r) => r.id === issuing.route)?.line} · ${LABEL[issuing.dim.key]} measured ${issuing.dim.measured} against ${issuing.dim.required}`
            : ''
        }
      />
      <ReasonDialog
        open={!!ruling}
        onClose={() => setRuling(null)}
        onConfirm={rule}
        title={ruling?.outcome === 'uphold' ? 'Uphold the finding' : 'Withdraw the finding'}
        confirmLabel={ruling?.outcome === 'uphold' ? 'Uphold' : 'Withdraw'}
        variant={ruling?.outcome === 'uphold' ? 'danger' : 'primary'}
        minLength={25}
        subtitle={
          ruling
            ? `${ruling.finding.id} — ${
                ruling.outcome === 'uphold'
                  ? 'upholding triggers the configured sanction and updates the permit record.'
                  : 'withdrawing clears the finding; the measurement stays on the record.'
              }`
            : ''
        }
      />
    </>
  )
}
