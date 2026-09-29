import { Inbox } from 'lucide-react'
import { useTx } from '../../lib/adminLang.js'
export default function Empty({ title = 'Nothing here', hint, icon: Icon = Inbox, action, compact }) {
  const tx = useTx()
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-16'} px-6`}>
      <div className="w-10 h-10 rounded-full bg-ink-100 flex items-center justify-center mb-3">
        <Icon size={18} className="text-ink-400" />
      </div>
      <p className="text-[13px] font-medium text-ink-700">{tx(title)}</p>
      {hint && <p className="text-xs text-ink-500 mt-1 max-w-sm leading-relaxed">{tx(hint)}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
