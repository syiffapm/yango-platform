import { useState } from 'react'
import { BadgeCheck, Gavel, Paperclip } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import { NotMeasurable } from '../../../components/domain/CoverageChip.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dt, relative } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
const DIM_LABEL = {
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
  const { db, findings, routes: myRoutes, update, audit, notify, op } = useOperator()
  const toast = useToast()
  const [disputing, setDisputing] = useState(null)
  const myCompliance = db.compliance.filter((c) => (c.operators || [c.operator]).includes(op.id))
  const dispute = (reason) => {
    update((d) => {
      const f = d.findings.find((x) => x.id === disputing.id)
      f.status = 'disputed'
      f.dispute = { at: new Date().toISOString(), by: op.id, reason, evidence: ['operator-evidence.pdf'] }
    })
    audit({
      actor: op.id,
      role: 'po_admin',
      action: 'Disputed finding',
      object: disputing.id,
      reason,
      category: 'Compliance',
    })
    notify({
      audience: 'authority',
      title: 'Finding disputed',
      body: `${op.name} disputed ${disputing.id}. An adjudicator who did not issue the finding must rule.`,
    })
    toast({ title: 'Dispute filed', body: 'A different officer will rule on the dispute.' })
    setDisputing(null)
  }
  return (
    <>
      <PageHeader
        title="Compliance"
        subtitle="Your own compliance matrix per line and dimension. A measurement is not a finding: where data coverage is too low the dimension reads “not measurable”, never “failed”."
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Lines measured"
          value={myCompliance.length}
          icon={BadgeCheck}
          method="Your permitted lines with at least one measurable dimension today."
        />
        <Stat
          label="Dimensions in breach"
          value={myCompliance.reduce((s, c) => s + c.dimensions.filter((d) => d.breach).length, 0)}
          tone="warn"
          method="Measured below the threshold in force for the service class."
        />
        <Stat
          label="Not measurable"
          value={myCompliance.reduce((s, c) => s + c.dimensions.filter((d) => !d.measurable).length, 0)}
          tone="muted"
          method="Data coverage below the census floor of 50% — shown as not measurable, never as failure."
        />
        <Stat
          label="Open findings"
          value={findings.filter((f) => ['issued', 'disputed'].includes(f.status)).length}
          tone={findings.some((f) => f.status === 'issued') ? 'bad' : 'good'}
          method="Findings awaiting your reply or an adjudicator's ruling."
        />
      </StatGrid>

      <Card className="mb-4">
        <CardHeader
          title="Compliance matrix"
          subtitle="Thresholds in force are shown per service class and are never applied retroactively."
        />
        <CardBody className="p-0 overflow-x-auto scroll-thin">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="px-4 py-2.5 text-[11.5px] uppercase tracking-wider text-ink-400">Line</th>
                <th className="px-3 py-2.5 text-[11.5px] uppercase tracking-wider text-ink-400">Coverage</th>
                {['operating_hours', 'frequency', 'route_coverage', 'fleet_availability', 'service_standard'].map(
                  (d) => (
                    <th key={d} className="px-3 py-2.5 text-[11.5px] uppercase tracking-wider text-ink-400">
                      {DIM_LABEL[d]}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {myCompliance.map((c) => {
                const route = routes.find((r) => r.id === c.route)
                return (
                  <tr key={c.route} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-3">
                      <span className="text-[12.5px] font-medium text-ink-900">{route?.line}</span>
                      <span className="block text-[11.5px] text-ink-400">{route?.name}</span>
                      {route?.class === 'BRT' && (
                        <Badge tone="brand" className="mt-1">
                          BRT
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={c.coveragePct >= 80 ? 'green' : c.coveragePct >= 50 ? 'amber' : 'red'}>
                        {c.coveragePct}%
                      </Badge>
                    </td>
                    {['operating_hours', 'frequency', 'route_coverage', 'fleet_availability', 'service_standard'].map(
                      (key) => {
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
                              {d.unit.includes('%') ? '%' : ' min'}
                            </span>
                            <span className="block text-[11px] text-ink-400">
                              req {d.required}
                              {d.unit.includes('%') ? '%' : ' min'}
                            </span>
                          </td>
                        )
                      },
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Findings and disputes"
          subtitle="A finding is a formal notice that a measured breach is being acted on. You may dispute with evidence; a different officer rules."
          icon={Gavel}
        />
        <CardBody className="space-y-3">
          {findings.map((f) => (
            <div key={f.id} className="rounded-xl border border-ink-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink-900">{f.id}</span>
                    <StatusPill status={f.status} />
                    <Badge tone="slate">{routes.find((r) => r.id === f.route)?.line}</Badge>
                  </div>
                  <p className="text-[12px] text-ink-600 mt-1">
                    {DIM_LABEL[f.dimension]} — measured {f.measured} against a requirement of {f.required} · issued{' '}
                    {relative(f.issuedAt)}
                  </p>
                </div>
                {f.status === 'issued' && (
                  <Button size="sm" variant="primary" onClick={() => setDisputing(f)}>
                    Dispute with evidence
                  </Button>
                )}
              </div>

              <div className="mt-3 rounded-lg bg-ink-50 border border-ink-100 p-3">
                <p className="text-[11.5px] uppercase tracking-wider text-ink-400 mb-1">Officer's written reason</p>
                <p className="text-[12.5px] text-ink-800 leading-relaxed">“{f.reason}”</p>
              </div>

              {f.dispute && (
                <div className="mt-2 rounded-lg bg-sky-50 border border-sky-200 p-3">
                  <p className="text-[11.5px] uppercase tracking-wider text-sky-700 mb-1">Your dispute</p>
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
                    Adjudicator ruling — {f.ruling.outcome}
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
            </div>
          ))}
          {findings.length === 0 && (
            <Empty
              compact
              icon={BadgeCheck}
              title="No findings against your company"
              hint="Measurements alone are not findings — an officer must decide, with a written reason."
            />
          )}
        </CardBody>
      </Card>

      <ReasonDialog
        open={!!disputing}
        onClose={() => setDisputing(null)}
        onConfirm={dispute}
        title="Dispute this finding"
        confirmLabel="File dispute"
        variant="primary"
        minLength={30}
        subtitle="Set out the facts that contradict the measurement and attach evidence. An officer who did not issue the finding will rule."
      />
    </>
  )
}
