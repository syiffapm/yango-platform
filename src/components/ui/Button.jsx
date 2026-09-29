import { useTx } from '../../lib/adminLang.js'
const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
  secondary: 'bg-white text-ink-800 border border-ink-200 hover:bg-ink-50 active:bg-ink-100',
  ghost: 'text-ink-600 hover:bg-ink-100 active:bg-ink-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-100',
  dark: 'bg-ink-900 text-white hover:bg-ink-800',
}
const sizes = {
  xs: 'text-[12px] px-3 py-2 min-h-[40px] gap-1 rounded-md',
  sm: 'text-xs px-3.5 py-2 min-h-[40px] gap-1.5 rounded-lg',
  md: 'text-sm px-3.5 py-2.5 min-h-[40px] gap-2 rounded-lg',
  lg: 'text-base px-5 py-3 min-h-[48px] gap-2 rounded-xl',
}
export default function Button({
  as: As = 'button',
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  className = '',
  children,
  full,
  ...rest
}) {
  const tx = useTx()
  return (
    <As
      className={`inline-flex items-center justify-center font-medium transition-colors disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap ${variants[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={size === 'lg' ? 18 : size === 'xs' ? 13 : 15} strokeWidth={2.1} />}
      {typeof children === 'string' ? tx(children) : children}
      {IconRight && <IconRight size={size === 'lg' ? 18 : 15} strokeWidth={2.1} />}
    </As>
  )
}
export function IconButton({ icon: Icon, label, size = 16, className = '', ...rest }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800 transition-colors ${className}`}
      {...rest}
    >
      <Icon size={size} strokeWidth={2.1} />
    </button>
  )
}
