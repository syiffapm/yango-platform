import { Link } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import { useDb } from '../../../lib/store.jsx'
import { relative } from '../../../lib/format.js'
export default function Notifications() {
  const { db, update } = useDb()
  const list = db.notifications.filter((n) => n.audience === 'citizen')
  const markAll = () =>
    update((d) => {
      d.notifications.forEach((n) => {
        if (n.audience === 'citizen') n.read = true
      })
    })
  return (
    <div>
      <AppBar
        title="Notifications"
        back
        right={
          <Button size="xs" icon={CheckCheck} onClick={markAll}>
            Read all
          </Button>
        }
      />
      <div className="p-4 space-y-2">
        {list.map((n) => {
          const Wrapper = n.deepLink ? Link : 'div'
          return (
            <Wrapper
              key={n.id}
              {...(n.deepLink ? { to: n.deepLink } : {})}
              className={`block rounded-xl border px-3.5 py-3 ${n.read ? 'bg-white border-ink-200' : 'bg-brand-50/60 border-brand-200'}`}
            >
              <div className="flex items-start gap-2.5">
                <Bell size={15} className={n.read ? 'text-ink-400 mt-px' : 'text-brand-600 mt-px'} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-ink-900">{n.title}</p>
                  <p className="text-[13px] text-ink-600 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[12px] text-ink-400 mt-1">{relative(n.at)}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />}
              </div>
            </Wrapper>
          )
        })}
        {list.length === 0 && <Empty title="No notifications" />}
        <p className="text-[12px] text-ink-400 pt-2 leading-relaxed">
          Safety messages always reach you, even if you have turned marketing messages off or set quiet hours.
        </p>
      </div>
    </div>
  )
}
