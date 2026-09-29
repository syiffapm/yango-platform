import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import { useDb } from '../../../lib/store.jsx'
import { routes } from '../../../data/geo.js'
import { dt } from '../../../lib/format.js'
const STEPS = ['new', 'acknowledged', 'forwarded', 'operator_responded', 'verified', 'closed']
const LABEL = {
  new: 'Received',
  acknowledged: 'Acknowledged by the authority',
  forwarded: 'Forwarded to the operator',
  operator_responded: 'Operator responded',
  verified: 'Response verified',
  closed: 'Closed',
}
export default function MyReports() {
  const { db } = useDb()
  const reports = db.citizenReports
  return (
    <div>
      <AppBar title="My reports" subtitle="Tracked by reference number" back />
      <div className="p-4 space-y-3">
        {reports.map((r) => {
          const inc = db.incidents.find((i) => i.ref === r.ref)
          const stage = STEPS.indexOf(inc?.status || r.status)
          return (
            <div key={r.id} className="bg-white rounded-xl border border-ink-200 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13.5px] font-semibold text-ink-900">{r.category}</p>
                  <p className="text-[12.5px] text-ink-500">
                    {routes.find((x) => x.id === r.route)?.line} · {dt(r.at)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <StatusPill status={inc?.status || r.status} />
                  <p className="font-mono text-[12px] text-ink-400 mt-1">{r.ref}</p>
                </div>
              </div>

              <ol className="mt-3 space-y-1.5">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${i <= stage ? 'bg-brand-500' : 'bg-ink-200'}`} />
                    <span className={`text-[12.5px] ${i <= stage ? 'text-ink-700' : 'text-ink-300'}`}>{LABEL[s]}</span>
                  </li>
                ))}
              </ol>

              {r.anonymous && (
                <Badge tone="slate" className="mt-2.5">
                  Filed anonymously
                </Badge>
              )}
              {inc?.closure && (
                <div className="mt-2.5 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5">
                  <p className="text-[12px] uppercase tracking-wider text-emerald-700">Closed with reason</p>
                  <p className="text-[13px] text-emerald-900 mt-0.5 leading-relaxed">“{inc.closure.reason}”</p>
                </div>
              )}
            </div>
          )
        })}
        {reports.length === 0 && (
          <Empty title="No reports filed" hint="Reports you file are tracked here by reference number." />
        )}
      </div>
    </div>
  )
}
