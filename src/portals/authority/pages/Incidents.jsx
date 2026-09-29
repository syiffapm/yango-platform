import { useState } from 'react'
import { useTx } from '../../../lib/adminLang.js'
import { Check, Forward, Lock, Paperclip, ShieldAlert, Sparkles, UserPlus } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Drawer from '../../../components/ui/Drawer.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Badge, { PriorityPill, StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Steps } from '../../../components/ui/Progress.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import useAuthority from '../useAuthority.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { countdown, dt, relative } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
import { openIncidents } from '../../../lib/store.jsx'
const LIFECYCLE = ['New', 'Acknowledged', 'Forwarded', 'Operator responded', 'Verified', 'Closed']
const STAGE = { new: 0, acknowledged: 1, forwarded: 2, operator_responded: 3, verified: 4, closed: 5 }
export default function Incidents() {
  const tx = useTx()
  const { db, update, audit, notify, me, can } = useAuthority()
  const toast = useToast()
  const [sel, setSel] = useState(null)
  const [closing, setClosing] = useState(false)
  const rows = db.incidents.map((i) => ({
    ...i,
    line: routes.find((r) => r.id === i.route)?.line || '—',
    operatorName: (db.operators || []).find((o) => o.id === i.operator)?.short || i.operator,
    sla: countdown(i.slaDueAt),
  }))
  const open = openIncidents(db)
  const overdue = open.filter((i) => countdown(i.slaDueAt).overdue)
  const unowned = open.filter((i) => !i.owner)
  const touch = (id, fn, entry) =>
    update((d) => {
      const i = d.incidents.find((x) => x.id === id)
      fn(i)
      if (entry) i.timeline.unshift({ at: new Date().toISOString(), actor: me.id, ...entry })
    })
  const acknowledge = (inc) => {
    touch(
      inc.id,
      (i) => {
        i.status = 'acknowledged'
        i.acknowledgedAt = new Date().toISOString()
        i.owner = me.id
      },
      { action: 'Acknowledged' },
    )
    audit({ actor: me.id, role: me.role, action: 'Acknowledged incident', object: inc.id, category: 'Incidents' })
    toast({ title: 'Acknowledged', body: `${inc.id} is now owned by you.` })
    setSel((s) => (s ? { ...s, status: 'acknowledged', owner: me.id } : s))
  }
  const forward = (inc) => {
    touch(
      inc.id,
      (i) => {
        i.status = 'forwarded'
      },
      { action: 'Forwarded to operator' },
    )
    audit({
      actor: me.id,
      role: me.role,
      action: 'Forwarded incident to operator',
      object: inc.id,
      category: 'Incidents',
    })
    notify({
      audience: 'operator',
      title: `Incident forwarded — ${inc.id}`,
      body: `${inc.category} on ${inc.line}. A written response is required.`,
    })
    toast({ title: 'Forwarded to operator', body: 'The operator must respond with a written reason.' })
    setSel((s) => (s ? { ...s, status: 'forwarded' } : s))
  }
  const verify = (inc) => {
    touch(
      inc.id,
      (i) => {
        i.status = 'verified'
      },
      { action: 'Operator response verified' },
    )
    audit({ actor: me.id, role: me.role, action: 'Verified operator response', object: inc.id, category: 'Incidents' })
    toast({ title: 'Response verified' })
    setSel((s) => (s ? { ...s, status: 'verified' } : s))
  }
  const close = (reason) => {
    touch(
      sel.id,
      (i) => {
        i.status = 'closed'
        i.closure = { at: new Date().toISOString(), by: me.id, reason }
      },
      { action: 'Closed', reason },
    )
    audit({ actor: me.id, role: me.role, action: 'Closed incident', object: sel.id, reason, category: 'Incidents' })
    notify({ audience: 'operator', title: `Incident closed — ${sel.id}`, body: reason })
    toast({ title: 'Incident closed', body: 'Closing is the only irreversible step in the lifecycle.' })
    setSel(null)
  }
  const actionFor = (inc) => {
    if (!can.acknowledge) return null
    switch (inc.status) {
      case 'new':
        return (
          <Button variant="primary" icon={Check} onClick={() => acknowledge(inc)}>
            Acknowledge
          </Button>
        )
      case 'acknowledged':
        return (
          <Button variant="primary" icon={Forward} onClick={() => forward(inc)}>
            Forward to operator
          </Button>
        )
      case 'operator_responded':
        return (
          <Button variant="primary" icon={Check} onClick={() => verify(inc)}>
            Verify response
          </Button>
        )
      case 'verified':
        return (
          <Button variant="danger" icon={Lock} onClick={() => setClosing(true)}>
            Close with reason
          </Button>
        )
      case 'forwarded':
        return <Badge tone="amber">Awaiting the operator's written response</Badge>
      default:
        return null
    }
  }
  return (
    <>
      <PageHeader
        title="Incidents & SOS"
        subtitle="One queue for every report, whatever its source. Closing an incident requires a written reason and is the only irreversible step."
      />

      <StatGrid cols={5} className="mb-5">
        <Stat
          label="Open"
          value={open.length}
          tone={open.length ? 'warn' : 'good'}
          icon={ShieldAlert}
          method="Incidents in any state other than closed."
        />
        <Stat
          label="Acknowledge overdue"
          value={overdue.length}
          tone={overdue.length ? 'bad' : 'good'}
          method="Open incidents past the acknowledgement SLA for their priority (P1 5 min, P2 15 min, P3 4 h, P4 3 days)."
        />
        <Stat
          label="Without owner"
          value={unowned.length}
          tone={unowned.length ? 'warn' : 'good'}
          method="No named officer has taken responsibility yet."
        />
        <Stat
          label="Reported today"
          value={db.incidents.filter((i) => new Date(i.reportedAt) > Date.now() - 86400000).length}
          method="New reports in the last 24 hours across every source."
        />
        <Stat
          label="Acknowledge vs SLA"
          value="4m 12s"
          unit="median"
          tone="good"
          method="Median time from report to acknowledgement. p90 is 11m 40s. The target is is 95% of P1 within 5 minutes."
        />
      </StatGrid>

      <DataTable
        columns={[
          { key: 'priority', header: 'Pri', width: 60, render: (r) => <PriorityPill priority={r.priority} /> },
          {
            key: 'reportedAt',
            header: 'Reported',
            render: (r) => <span title={dt(r.reportedAt)}>{relative(r.reportedAt)}</span>,
          },
          {
            key: 'category',
            header: 'Category',
            render: (r) => (
              <span className="inline-flex items-center gap-1.5">
                {r.isSOS && <Badge tone="red">SOS</Badge>}
                {r.category}
              </span>
            ),
          },
          { key: 'location', header: 'Location' },
          { key: 'line', header: 'Line' },
          { key: 'operatorName', header: 'Operator' },
          { key: 'source', header: 'Source' },
          {
            key: 'owner',
            header: 'Owner',
            render: (r) => db.users.find((u) => u.id === r.owner)?.name || <Badge tone="amber">Unassigned</Badge>,
          },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          {
            key: 'slaDueAt',
            header: 'SLA',
            align: 'right',
            render: (r) =>
              r.status === 'closed' ? (
                <span className="text-ink-300">—</span>
              ) : (
                <span
                  className={`text-[12.5px] tabular-nums ${r.sla.overdue ? 'text-red-600 font-semibold' : 'text-ink-500'}`}
                >
                  {r.sla.text}
                </span>
              ),
          },
        ]}
        rows={rows}
        onRowClick={setSel}
        exportName="incidents"
        searchKeys={['id', 'category', 'location', 'ref']}
        filters={[
          {
            key: 'priority',
            label: 'Priority',
            options: ['P1', 'P2', 'P3', 'P4'].map((p) => ({ value: p, label: p })),
          },
          {
            key: 'status',
            label: 'Status',
            options: Object.keys(STAGE).map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          {
            key: 'source',
            label: 'Source',
            options: ['passenger', 'driver', 'operator', 'system'].map((s) => ({ value: s, label: s })),
          },
        ]}
        pageSize={12}
      />

      <Drawer
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel ? `${sel.category} · ${sel.id}` : ''}
        subtitle={sel ? `${sel.line} · ${sel.location} · reported ${relative(sel.reportedAt)}` : ''}
        footer={sel && actionFor(sel)}
      >
        {sel && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityPill priority={sel.priority} />
              <StatusPill status={sel.status} />
              {sel.isSOS && <Badge tone="red">SOS</Badge>}
              <Badge tone="slate">Ref {sel.ref}</Badge>
            </div>

            <Steps steps={LIFECYCLE} current={STAGE[sel.status] ?? 0} />

            <p className="text-[12.5px] text-ink-700 leading-relaxed">{sel.description}</p>

            <dl className="divide-y divide-ink-100 border-y border-ink-100">
              {[
                ['Reported', dt(sel.reportedAt)],
                ['Acknowledged', sel.acknowledgedAt ? dt(sel.acknowledgedAt) : 'Not yet'],
                ['SLA', countdown(sel.slaDueAt).text],
                ['Source', sel.source],
                ['Reporter identity', 'Never shown — reference number only'],
                ['Operator', (db.operators || []).find((o) => o.id === sel.operator)?.name || '—'],
                ['Vehicle', db.vehicles.find((v) => v.id === sel.vehicle)?.plate || '—'],
                ['Owner', db.users.find((u) => u.id === sel.owner)?.name || 'Unassigned'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-[12.5px] text-ink-500">{tx(k)}</dt>
                  <dd className="text-[12px] text-ink-900 text-right">{v}</dd>
                </div>
              ))}
            </dl>

            {sel.evidence?.length > 0 && (
              <div>
                <p className="text-[12px] uppercase tracking-wider text-ink-400 mb-2">Evidence</p>
                {sel.evidence.map((e) => (
                  <div key={e} className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 mb-1.5">
                    <Paperclip size={14} className="text-ink-400" />
                    <span className="text-[12px] text-ink-700">{e}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
              <p className="text-[11.5px] uppercase tracking-wider text-violet-700 mb-1 inline-flex items-center gap-1.5">
                <Sparkles size={11} /> AI triage — advisory only
              </p>
              <p className="text-[12.5px] text-violet-900 leading-relaxed">
                Suggested priority {sel.priority}; category “{sel.category}”; no duplicate cluster detected. A named
                officer still makes the decision.
              </p>
            </div>

            {sel.operatorResponse && (
              <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
                <p className="text-[11.5px] uppercase tracking-wider text-ink-400 mb-1">Operator response</p>
                <p className="text-[12.5px] text-ink-800 leading-relaxed">“{sel.operatorResponse.reason}”</p>
                <p className="text-[11.5px] text-ink-400 mt-1.5">
                  {sel.operatorResponse.by} · {dt(sel.operatorResponse.at)}
                </p>
              </div>
            )}

            {sel.closure && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[11.5px] uppercase tracking-wider text-emerald-700 mb-1">
                  Closed with written reason
                </p>
                <p className="text-[12.5px] text-emerald-900 leading-relaxed">“{sel.closure.reason}”</p>
                <p className="text-[11.5px] text-emerald-700/70 mt-1.5">
                  {db.users.find((u) => u.id === sel.closure.by)?.name} · {dt(sel.closure.at)}
                </p>
              </div>
            )}

            {!can.acknowledge && sel.status !== 'closed' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2.5">
                <UserPlus size={15} className="text-amber-600 mt-px shrink-0" />
                <p className="text-[12.5px] text-amber-900 leading-relaxed">
                  Only the safety &amp; incident officer may acknowledge, forward, verify or close. Switch identity from
                  the top-right menu to act on this incident.
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <ReasonDialog
        open={closing}
        onClose={() => setClosing(false)}
        onConfirm={close}
        title="Close incident"
        confirmLabel="Close incident"
        variant="danger"
        minLength={20}
        subtitle="Closing cannot be undone. State what was verified and why no further action is needed."
      />
    </>
  )
}
