import { TriangleAlert, Info, OctagonAlert } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import { useDb } from '../../../lib/store.jsx'
import { routes } from '../../../data/geo.js'
import { dt } from '../../../lib/format.js'
const SEV = {
  info: { icon: Info, tone: 'blue', cls: 'border-sky-200 bg-sky-50' },
  warning: { icon: TriangleAlert, tone: 'amber', cls: 'border-amber-200 bg-amber-50' },
  critical: { icon: OctagonAlert, tone: 'red', cls: 'border-red-200 bg-red-50' },
}
export default function Alerts() {
  const { db } = useDb()
  const list = db.announcements.filter((a) => a.status === 'published')
  return (
    <div>
      <AppBar title="Service alerts" subtitle="Detours, closures, festival services and weather" back />
      <div className="p-4 space-y-3">
        {list.map((a) => {
          const s = SEV[a.severity] || SEV.info
          const Icon = s.icon
          return (
            <div key={a.id} className={`rounded-xl border p-3.5 ${s.cls}`}>
              <div className="flex items-start gap-2.5">
                <Icon size={16} className="mt-px shrink-0 text-ink-700" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink-900">{a.title}</p>
                  {a.titleMM && <p className="text-[13px] text-ink-600">{a.titleMM}</p>}
                  <p className="text-[13px] text-ink-700 mt-1.5 leading-relaxed">{a.body}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {a.routes.map((r) => (
                      <Badge key={r} tone="slate">
                        {routes.find((x) => x.id === r)?.line}
                      </Badge>
                    ))}
                    <Badge tone={s.tone}>{a.severity}</Badge>
                  </div>
                  <p className="text-[12px] text-ink-400 mt-2">
                    From {dt(a.from)} to {dt(a.to)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        {list.length === 0 && (
          <Empty
            title="No service alerts"
            hint="You will be notified about detours and closures on the lines you follow."
          />
        )}
      </div>
    </div>
  )
}
