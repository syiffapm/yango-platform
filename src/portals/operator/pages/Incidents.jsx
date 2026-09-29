import { useState } from 'react'
import { useTx } from '../../../lib/adminLang.js'
import { AlertTriangle, Paperclip, Send } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { PriorityPill, StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Drawer from '../../../components/ui/Drawer.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { dt, relative } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
export default function Incidents() {
  const tx = useTx()
  const { incidents, vehicles, update, audit, notify, op } = useOperator()
  const toast = useToast()
  const [sel, setSel] = useState(null)
  const [responding, setResponding] = useState(false)
  const rows = incidents.map((i) => ({
    ...i,
    line: routes.find((r) => r.id === i.route)?.line,
    plate: vehicles.find((v) => v.id === i.vehicle)?.plate || i.vehicle,
  }))
  const respond = (reason) => {
    update((d) => {
      const i = d.incidents.find((x) => x.id === sel.id)
      i.operatorResponse = { at: new Date().toISOString(), by: `${op.short} dispatcher`, reason }
      i.status = 'operator_responded'
    })
    audit({
      actor: op.id,
      role: 'po_ops',
      action: 'Responded to forwarded incident',
      object: sel.id,
      reason,
      category: 'Incidents',
    })
    notify({ audience: 'authority', title: 'Operator responded', body: `${op.name} responded to ${sel.id}.` })
    toast({ title: 'Response sent', body: 'The authority will verify your response before closing the incident.' })
    setResponding(false)
    setSel(null)
  }
  const open = rows.filter((r) => r.status !== 'closed')
  return (
    <>
      <PageHeader
        title="SOS & incidents"
        subtitle="SOS and reports forwarded to you on your own buses. You respond with a written reason and attach evidence; the authority verifies and closes. Reporter identity is never shown."
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Open"
          value={open.length}
          tone={open.length ? 'warn' : 'good'}
          icon={AlertTriangle}
          method="Incidents on your vehicles not yet closed by the safety officer."
        />
        <Stat
          label="P1 (SOS)"
          value={rows.filter((r) => r.priority === 'P1' && r.status !== 'closed').length}
          tone="bad"
          method="Life-safety incidents. Authority acknowledgement SLA is 5 minutes."
        />
        <Stat
          label="Awaiting your reply"
          value={rows.filter((r) => r.status === 'forwarded').length}
          tone="warn"
          method="Forwarded to you — a written response is required."
        />
        <Stat
          label="Closed"
          value={rows.filter((r) => r.status === 'closed').length}
          method="Closed by the authority with a written reason."
        />
      </StatGrid>

      <DataTable
        columns={[
          { key: 'priority', header: 'Pri', width: 60, render: (r) => <PriorityPill priority={r.priority} /> },
          { key: 'reportedAt', header: 'Reported', render: (r) => relative(r.reportedAt) },
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
          { key: 'line', header: 'Line' },
          { key: 'plate', header: 'Vehicle' },
          { key: 'location', header: 'Location' },
          { key: 'source', header: 'Source' },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
        ]}
        rows={rows}
        onRowClick={setSel}
        exportName="incidents"
        filters={[
          {
            key: 'priority',
            label: 'Priority',
            options: ['P1', 'P2', 'P3', 'P4'].map((p) => ({ value: p, label: p })),
          },
          {
            key: 'status',
            label: 'Status',
            options: [...new Set(rows.map((r) => r.status))].map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
        ]}
        empty="No incidents on your fleet"
      />

      <Drawer
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel ? `${sel.category} · ${sel.id}` : ''}
        subtitle={sel ? `${sel.line} · ${sel.plate} · reported ${relative(sel.reportedAt)}` : ''}
        footer={
          sel &&
          sel.status !== 'closed' && (
            <Button variant="primary" icon={Send} onClick={() => setResponding(true)}>
              Respond with reason
            </Button>
          )
        }
      >
        {sel && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityPill priority={sel.priority} />
              <StatusPill status={sel.status} />
              {sel.isSOS && <Badge tone="red">SOS</Badge>}
              <Badge tone="slate">Ref {sel.ref}</Badge>
            </div>

            <p className="text-[12.5px] text-ink-700 leading-relaxed">{sel.description}</p>

            <dl className="divide-y divide-ink-100 border-y border-ink-100">
              {[
                ['Reported', dt(sel.reportedAt)],
                ['Location', sel.location],
                ['Source', sel.source],
                ['Reporter', 'Not disclosed — reference number only'],
                ['Authority acknowledged', sel.acknowledgedAt ? dt(sel.acknowledgedAt) : 'Not yet'],
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
                <div className="space-y-1.5">
                  {sel.evidence.map((e) => (
                    <div key={e} className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2">
                      <Paperclip size={14} className="text-ink-400" />
                      <span className="text-[12px] text-ink-700">{e}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sel.operatorResponse && (
              <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
                <p className="text-[11.5px] uppercase tracking-wider text-ink-400 mb-1">Your response</p>
                <p className="text-[12.5px] text-ink-800 leading-relaxed">“{sel.operatorResponse.reason}”</p>
                <p className="text-[11.5px] text-ink-400 mt-1.5">
                  {sel.operatorResponse.by} · {dt(sel.operatorResponse.at)}
                </p>
              </div>
            )}

            {sel.closure && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[11.5px] uppercase tracking-wider text-emerald-700 mb-1">Closed by the authority</p>
                <p className="text-[12.5px] text-emerald-900 leading-relaxed">“{sel.closure.reason}”</p>
                <p className="text-[11.5px] text-emerald-700/70 mt-1.5">{dt(sel.closure.at)}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <ReasonDialog
        open={responding}
        onClose={() => setResponding(false)}
        onConfirm={respond}
        title="Respond to the authority"
        confirmLabel="Send response"
        variant="primary"
        minLength={25}
        subtitle="Set out what you found, what you did and what prevents a repeat. The authority verifies the response before closing."
      />
    </>
  )
}
