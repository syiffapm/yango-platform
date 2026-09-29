import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Download } from 'lucide-react'
import Button from './Button.jsx'
import Empty from './Empty.jsx'
import { useTx } from '../../lib/adminLang.js'

/**
 * Columns: { key, header, render?, sortable?, width?, align?, className? }
 * Filters: [{ key, label, options: [{value,label}] }]
 */
export default function DataTable({
  columns,
  rows,
  rowKey = (r, i) => r.id ?? i,
  onRowClick,
  search = true,
  searchKeys,
  filters = [],
  pageSize = 12,
  dense = false,
  empty = 'Nothing here yet',
  toolbar,
  exportName,
}) {
  const tx = useTx()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState(null)
  const [page, setPage] = useState(0)
  const [active, setActive] = useState({})
  const filtered = useMemo(() => {
    let out = rows
    if (q.trim()) {
      const needle = q.toLowerCase()
      const keys = searchKeys || columns.map((c) => c.key)
      out = out.filter((r) =>
        keys.some((k) =>
          String(r[k] ?? '')
            .toLowerCase()
            .includes(needle),
        ),
      )
    }
    Object.entries(active).forEach(([k, v]) => {
      if (v && v !== '__all') out = out.filter((r) => String(r[k]) === v)
    })
    if (sort) {
      out = [...out].sort((a, b) => {
        const av = a[sort.key],
          bv = b[sort.key]
        if (av == null) return 1
        if (bv == null) return -1
        const r = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
        return sort.dir === 'asc' ? r : -r
      })
    }
    return out
  }, [rows, q, sort, active, columns, searchKeys])
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pages - 1)
  const view = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize)
  const toggleSort = (key) =>
    setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null))
  const doExport = () => {
    const head = columns.map((c) => c.header).join(',')
    const body = filtered.map((r) => columns.map((c) => JSON.stringify(String(r[c.key] ?? ''))).join(',')).join('\n')
    const blob = new Blob([`${head}\n${body}`], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${exportName || 'export'}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  return (
    <div className="bg-white rounded-xl border border-ink-200/70 overflow-hidden">
      {(search || filters.length > 0 || toolbar || exportName) && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-ink-100 bg-ink-50/40">
          {search && (
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(0)
                }}
                placeholder={tx('Search…')}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-ink-200 rounded-lg outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          )}
          {filters.map((f) => (
            <select
              key={f.key}
              value={active[f.key] || '__all'}
              onChange={(e) => {
                setActive((a) => ({ ...a, [f.key]: e.target.value }))
                setPage(0)
              }}
              className="text-xs bg-white border border-ink-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-400"
            >
              <option value="__all">
                {tx(f.label)}: {tx('all')}
              </option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {tx(o.label)}
                </option>
              ))}
            </select>
          ))}
          {filters.length > 0 && <SlidersHorizontal size={13} className="text-ink-300 hidden sm:block" />}
          <div className="flex-1" />
          {toolbar}
          {exportName && (
            <Button size="xs" icon={Download} onClick={doExport}>
              CSV
            </Button>
          )}
        </div>
      )}

      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink-100 bg-white">
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  className={`px-3 ${dense ? 'py-1.5' : 'py-2.5'} text-[11.5px] font-semibold uppercase tracking-wider text-ink-400 ${c.align === 'right' ? 'text-right' : ''} ${c.sortable !== false ? 'cursor-pointer select-none hover:text-ink-700' : ''}`}
                  onClick={() => c.sortable !== false && toggleSort(c.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {tx(c.header)}
                    {sort?.key === c.key && (sort.dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r, i) => (
              <tr
                key={rowKey(r, i)}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={`border-b border-ink-50 last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-brand-50/50' : 'hover:bg-ink-50/50'} transition-colors`}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 ${dense ? 'py-1.5' : 'py-2.5'} text-[12.5px] text-ink-700 align-middle ${c.align === 'right' ? 'text-right' : ''} ${c.className || ''}`}
                  >
                    {c.render ? c.render(r) : (r[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {view.length === 0 && <Empty title={empty} compact />}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-ink-100 bg-ink-50/40">
          <span className="text-[12px] text-ink-500">
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} {tx('of')}{' '}
            {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button size="xs" icon={ChevronLeft} disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              Prev
            </Button>
            <Button
              size="xs"
              iconRight={ChevronRight}
              disabled={safePage >= pages - 1}
              onClick={() => setPage(safePage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
