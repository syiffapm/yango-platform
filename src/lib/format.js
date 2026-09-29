export const MMK = (n) => (n == null ? '—' : new Intl.NumberFormat('en-US').format(Math.round(n)) + ' MMK')

export const num = (n, d = 0) =>
  n == null || Number.isNaN(n)
    ? '—'
    : new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)

export const pct = (n, d = 0) => (n == null || Number.isNaN(n) ? '—' : `${n.toFixed(d)}%`)

export const dt = (iso, opts) =>
  !iso
    ? '—'
    : new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...opts,
      })

export const dateOnly = (iso) =>
  !iso ? '—' : new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

export const timeOnly = (iso) =>
  !iso ? '—' : new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export function relative(iso, lang = 'en') {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  const my = lang === 'my'
  const ago = (n, unit) => (my ? `${n} ${unit}အကြာက` : `${n} ${unit} ago`)
  const inn = (n, unit) => (my ? `${n} ${unit}အတွင်း` : `in ${n} ${unit}`)
  const units = my ? { min: 'မိနစ်', h: 'နာရီ', d: 'ရက်' } : { min: 'min', h: 'h', d: 'd' }
  if (Math.abs(m) < 1) return my ? 'ယခုပင်' : 'just now'
  if (Math.abs(m) < 60) return m > 0 ? ago(m, units.min) : inn(Math.abs(m), units.min)
  const h = Math.round(m / 60)
  if (Math.abs(h) < 24) return h > 0 ? ago(h, units.h) : inn(Math.abs(h), units.h)
  const d = Math.round(h / 24)
  return d > 0 ? ago(d, units.d) : inn(Math.abs(d), units.d)
}

export function countdown(iso) {
  if (!iso) return { text: '—', overdue: false }
  const ms = new Date(iso).getTime() - Date.now()
  const overdue = ms < 0
  const a = Math.abs(ms)
  const h = Math.floor(a / 3600000)
  const m = Math.floor((a % 3600000) / 60000)
  const s = Math.floor((a % 60000) / 1000)
  const text = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`
  return { text: overdue ? `${text} overdue` : text, overdue }
}

export const daysUntil = (iso) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

/**
 * Myanmar mobile numbers, written the way people read them out:
 * +95 9 7700 1234. Anything unrecognisable is returned untouched.
 */
export function phoneMM(input) {
  const d = String(input || '').replace(/\D/g, '')
  if (!d) return ''
  const local = d.startsWith('95') ? d.slice(2) : d.replace(/^0/, '')
  if (local.length < 8) return `+95 ${local}`
  const head = local.slice(0, 1)
  const rest = local.slice(1)
  return `+95 ${head} ${rest.slice(0, 4)} ${rest.slice(4)}`.trim()
}
