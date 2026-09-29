import { useTx } from '../../lib/adminLang.js'
export default function Tabs({ value, onChange, tabs, className = '', size = 'md' }) {
  const tx = useTx()
  return (
    <div className={`flex items-center gap-1 overflow-x-auto scroll-thin border-b border-ink-200 ${className}`}>
      {tabs.map((t) => {
        const on = value === t.value
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={`relative whitespace-nowrap px-3 ${size === 'sm' ? 'py-2 min-h-[40px] text-[12.5px]' : 'py-2.5 min-h-[40px] text-[12.5px]'} font-medium transition-colors ${on ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800'}`}
          >
            <span className="inline-flex items-center gap-1.5">
              {t.icon && <t.icon size={14} />}
              {tx(t.label)}
              {t.count != null && (
                <span
                  className={`rounded-full px-1.5 py-px text-[11px] font-semibold ${on ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'}`}
                >
                  {t.count}
                </span>
              )}
            </span>
            {on && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-brand-600 rounded-full" />}
          </button>
        )
      })}
    </div>
  )
}
export function Pills({ value, onChange, options, className = '' }) {
  const tx = useTx()
  return (
    <div className={`inline-flex rounded-lg bg-ink-100 p-0.5 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-2 min-h-[40px] text-[12.5px] font-medium rounded-md transition ${value === o.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
        >
          {tx(o.label)}
        </button>
      ))}
    </div>
  )
}
