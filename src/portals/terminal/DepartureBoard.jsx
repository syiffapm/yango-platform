import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Bus } from 'lucide-react'
import { useDb, useClock } from '../../lib/store.jsx'
import { useSession } from '../../lib/session.jsx'
import { routes, terminals } from '../../data/geo.js'
import { timeOnly } from '../../lib/format.js'
import { terminalDepartures } from '../../lib/schedule.js'
const STATUS = (dep, now) => {
  const mins = (new Date(dep.depart) - now) / 60000
  if (mins < -5) return { label: 'Departed', cls: 'text-white/40' }
  if (mins < 0) return { label: 'Boarding', cls: 'text-emerald-300' }
  if (mins < 20) return { label: 'Boarding soon', cls: 'text-amber-300' }
  return { label: 'On time', cls: 'text-white/70' }
}

/**
 * Public display board. Rendered full-screen at /board/:terminalId
 * and embedded in the terminal back office.
 */
export default function DepartureBoard({ public: isPublic }) {
  const params = useParams()
  const { db } = useDb()
  const [ses] = useSession('terminal')
  const now = useClock(1000)
  const terminalId = params.terminalId || ses.terminalId
  const terminal = terminals.find((t) => t.id === terminalId) || terminals[0]
  const deps = terminalDepartures(terminal.id, db, { limit: isPublic ? 12 : 8, now, includeDepartedMin: 15 })
  const body = (
    <div className="bg-ink-900 text-white rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Bus size={20} className="text-brand-300" />
          <div>
            <p className="text-[15px] font-semibold leading-tight">{terminal.name}</p>
            <p className="text-[12px] text-white/50">{terminal.nameMM} · departures</p>
          </div>
        </div>
        <p className="text-[22px] font-semibold tabular-nums">
          {new Date(now).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10">
            {['Time', 'Destination', 'Operator', 'Bay', 'Status'].map((h) => (
              <th key={h} className="px-5 py-2.5 text-[11.5px] uppercase tracking-wider text-white/40">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deps.map((d) => {
            const r = routes.find((x) => x.id === d.route)
            const op = (db.operators || []).find((o) => o.id === d.operator)
            const st = STATUS(d, now)
            return (
              <tr key={d.id} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-3 text-[19px] font-semibold tabular-nums">{timeOnly(d.depart)}</td>
                <td className="px-5 py-3">
                  <p className="text-[14px] font-medium">
                    {d.toward || r?.destination || r?.name.split('–')[1]?.trim() || r?.name}
                  </p>
                  <p className="text-[11.5px] text-white/40">
                    {r?.line} · {new Date(d.depart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </p>
                </td>
                <td className="px-5 py-3 text-[12.5px] text-white/70">{op?.name}</td>
                <td className="px-5 py-3">
                  <span className="inline-grid place-items-center min-w-9 h-8 px-2 rounded-lg bg-white/10 text-[14px] font-semibold tabular-nums">
                    {d.bay || '—'}
                  </span>
                </td>
                <td className={`px-5 py-3 text-[12.5px] font-medium ${st.cls}`}>{st.label}</td>
              </tr>
            )
          })}
          {deps.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-white/40 text-[13px]">
                No departures scheduled
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="px-5 py-2.5 border-t border-white/10 text-[11.5px] text-white/40">
        Bay allocations are confirmed 30 minutes before departure. Scan your ticket QR at the gate to check in.
      </div>
    </div>
  )
  if (!isPublic) return body
  return (
    <div className="min-h-screen bg-ink-900 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white mb-4">
          <ArrowLeft size={14} /> YanGo
        </Link>
        {body}
      </div>
    </div>
  )
}
