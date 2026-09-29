import { useTx } from '../../lib/adminLang.js'
export function Card({ className = '', children, ...rest }) {
  return (
    <div
      className={`bg-white rounded-xl border border-ink-200/70 shadow-[0_1px_2px_rgba(16,24,40,.04)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
export function CardHeader({ title, subtitle, action, icon: Icon, className = '' }) {
  const tx = useTx()
  return (
    <div className={`flex items-start justify-between gap-3 px-4 py-3 border-b border-ink-100 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} className="text-brand-600 shrink-0" strokeWidth={2.2} />}
          <h3 className="text-[13px] font-semibold text-ink-900 truncate">{tx(title)}</h3>
        </div>
        {subtitle && <p className="text-[12.5px] text-ink-500 mt-0.5 leading-snug">{tx(subtitle)}</p>}
      </div>
      {action && <div className="shrink-0 flex items-center gap-1.5">{action}</div>}
    </div>
  )
}
export function CardBody({ className = '', children }) {
  return <div className={`p-4 ${className}`}>{children}</div>
}
export function Section({ title, subtitle, action, children, className = '' }) {
  const tx = useTx()
  return (
    <section className={className}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-ink-900">{tx(title)}</h2>}
            {subtitle && <p className="text-xs text-ink-500 mt-0.5">{tx(subtitle)}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
