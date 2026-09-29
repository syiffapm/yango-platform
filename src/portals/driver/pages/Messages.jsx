import { Check } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import useDriver from '../useDriver.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { relative } from '../../../lib/format.js'
export default function Messages() {
  const { db, update } = useDriver()
  const toast = useToast()
  const list = db.notifications.filter((n) => n.audience === 'driver')
  const ack = (id) => {
    update((d) => {
      const n = d.notifications.find((x) => x.id === id)
      n.ack = true
      n.read = true
    })
    toast({ title: 'Acknowledged', body: 'Your operator sees that you have read this message.' })
  }
  return (
    <div>
      <AppBar title="Messages" subtitle="Broadcasts from your operator and the authority" />
      <div className="p-4 space-y-2">
        {list.map((n) => (
          <div
            key={n.id}
            className={`rounded-xl border p-3.5 ${n.ack ? 'bg-white border-ink-200' : 'bg-sky-50 border-sky-200'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13.5px] font-medium text-ink-900">{n.title}</p>
              {n.ack ? (
                <Badge tone="green" icon={Check}>
                  Acknowledged
                </Badge>
              ) : (
                <Badge tone="amber">Action needed</Badge>
              )}
            </div>
            <p className="text-[13px] text-ink-600 mt-1 leading-relaxed">{n.body}</p>
            <p className="text-[12px] text-ink-400 mt-1.5">{relative(n.at)}</p>
            {!n.ack && (
              <Button size="sm" variant="primary" className="mt-2.5" icon={Check} onClick={() => ack(n.id)}>
                Acknowledge
              </Button>
            )}
          </div>
        ))}
        {list.length === 0 && <Empty title="No messages" />}
      </div>
    </div>
  )
}
