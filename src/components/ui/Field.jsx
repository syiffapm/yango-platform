import { useTx } from '../../lib/adminLang.js'
export function Field({ label, hint, required, children, className = '', error }) {
  const tx = useTx()
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="block text-[12.5px] font-medium text-ink-600 mb-1.5">
          {tx(label)} {required && <span className="text-red-500">*</span>}
        </span>
      )}
      {children}
      {error && <span className="block text-[12px] text-red-600 mt-1">{error}</span>}
      {hint && !error && <span className="block text-[12px] text-ink-400 mt-1 leading-snug">{tx(hint)}</span>}
    </label>
  )
}
const base =
  'w-full text-[13px] bg-white border border-ink-200 rounded-lg px-3 py-2 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-ink-50 disabled:text-ink-400 placeholder:text-ink-300'
export function Input({ className = '', ...rest }) {
  return <input className={`${base} ${className}`} {...rest} />
}
export function Textarea({ className = '', rows = 3, ...rest }) {
  return <textarea rows={rows} className={`${base} resize-y ${className}`} {...rest} />
}
export function Select({ className = '', children, ...rest }) {
  return (
    <select className={`${base} ${className}`} {...rest}>
      {children}
    </select>
  )
}
export function Checkbox({ label, hint, className = '', ...rest }) {
  const tx = useTx()
  return (
    <label className={`flex items-start gap-2.5 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        className="mt-0.5 w-[18px] h-[18px] rounded border-ink-300 accent-brand-600 focus:ring-brand-300"
        {...rest}
      />
      <span className="text-[12.5px] text-ink-700 leading-snug">
        {tx(label)}
        {hint && <span className="block text-[12px] text-ink-400">{hint}</span>}
      </span>
    </label>
  )
}
export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer py-1">
      <span className="text-[12.5px] text-ink-700">
        {label}
        {hint && <span className="block text-[12px] text-ink-400">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        onClick={() => onChange?.(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-brand-600' : 'bg-ink-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
      </button>
    </label>
  )
}
export function RadioCards({ value, onChange, options, cols = 2 }) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {options.map((o) => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`text-left rounded-lg border px-3 py-2.5 transition ${on ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-ink-200 bg-white hover:border-ink-300'}`}
          >
            <span className="flex items-center gap-2">
              {o.icon && <o.icon size={15} className={on ? 'text-brand-600' : 'text-ink-400'} />}
              <span className={`text-[12.5px] font-medium ${on ? 'text-brand-800' : 'text-ink-800'}`}>{o.label}</span>
            </span>
            {o.hint && <span className="block text-[12px] text-ink-500 mt-0.5 leading-snug">{o.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}
