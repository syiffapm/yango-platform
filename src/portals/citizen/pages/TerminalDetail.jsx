import { Link, useParams } from 'react-router-dom'
import { Clock, Phone, Users } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import { useDb } from '../../../lib/store.jsx'
import { routes, terminals, stops } from '../../../data/geo.js'
import { destinationOf } from '../arrivals.js'
import { useT } from '../../../lib/i18n.jsx'
import { MMK, timeOnly } from '../../../lib/format.js'
import { destinationFromTerminal, terminalDepartures } from '../../../lib/schedule.js'
const stopLabel = (id) => [...stops, ...terminals].find((x) => x.id === id)?.name || id

export default function TerminalDetail() {
  const { id } = useParams()
  const { db } = useDb()
  const { t } = useT()
  const term = terminals.find((x) => x.id === id)
  if (!term) return <Empty title="Terminal not found" />
  const deps = terminalDepartures(term.id, db, { limit: 12 })
  const crowd = 40 + ((term.id.charCodeAt(2) * 7) % 50)
  // "Routes from here" means services that start here — a line that only ends
  // at this terminal is an arrival, and selling it from this page would be wrong.
  const startsHere = (r) => (r.terminals || [])[0] === term.id || (r.class !== 'Intercity' && r.stops[0] === term.id)
  const serving = routes.filter(
    (r) => startsHere(r) || (r.class !== 'Intercity' && (r.terminals || []).includes(term.id)),
  )
  const arrivingHere = routes.filter((r) => !serving.includes(r) && (r.terminals || []).includes(term.id))
  return (
    <div>
      <AppBar title={term.name} subtitle={term.nameMM} back />

      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            ['Open', term.openHours, Clock],
            ['Bays', term.bays.length, Users],
            ['Crowd', crowd > 75 ? 'Busy' : crowd > 45 ? 'Moderate' : 'Quiet', Users],
          ].map(([k, v, Icon]) => (
            <div key={k} className="bg-white rounded-xl border border-ink-200 px-3 py-2.5">
              <Icon size={13} className="text-brand-600" />
              <p className="text-[13.5px] font-semibold text-ink-900 mt-1.5">{v}</p>
              <p className="text-[11.5px] uppercase tracking-wider text-ink-400">{k}</p>
            </div>
          ))}
        </div>

        <p className="text-[14px] font-semibold text-ink-900 mb-2">Facilities</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {term.facilities.map((f) => (
            <Badge key={f} tone="slate">
              {f}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between mb-2">
          <p className="text-[14px] font-semibold text-ink-900">Next departures</p>
          <Button size="xs" as={Link} to={`/board/${term.id}`}>
            Departure board
          </Button>
        </div>
        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          {deps.map((d) => {
            const r = routes.find((x) => x.id === d.route)
            const op = (db.operators || []).find((o) => o.id === d.operator)
            return (
              <Link
                key={d.id}
                to={`/citizen/book/${d.route}`}
                className="flex items-center gap-3 px-3.5 py-2.5 border-b border-ink-50 last:border-0 active:bg-ink-50"
              >
                <span className="text-[14px] font-semibold text-ink-900 tabular-nums w-12">{timeOnly(d.depart)}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[11.5px] font-bold text-white shrink-0 ${d.kind === 'intercity' ? 'bg-sky-600' : 'bg-brand-500'}`}
                >
                  {r?.line}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink-900 truncate">
                    → {d.toward || (r ? destinationOf(r) : '')}
                  </p>
                  <p className="text-[12px] text-ink-500 truncate">
                    {d.kind === 'city'
                      ? `City line · every ${d.headwayMin} min · ${op?.name || ''}`
                      : `${op?.name} · bay ${d.bay || 'TBA'}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-semibold text-brand-700">{MMK(d.fare).replace(' MMK', '')}</p>
                  <p className="text-[11.5px] text-ink-400">{d.capacity - d.soldSeats.length} left</p>
                </div>
              </Link>
            )
          })}
          {deps.length === 0 && (
            <p className="text-[13px] text-ink-400 text-center py-6">
              No more departures today — the first services leave at {term.openHours.split('–')[0].trim()}.
            </p>
          )}
        </div>

        <p className="text-[14px] font-semibold text-ink-900 mt-5 mb-2">{t('home.routesFromHere')}</p>
        <div className="space-y-2">
          {serving.map((r) => {
            const op = (db.operators || []).find((o) => o.id === r.operator)
            return (
              <Link
                key={r.id}
                to={`/citizen/book/${r.id}`}
                className="block bg-white rounded-xl border border-ink-200 px-3 py-3 active:bg-ink-50"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-1 rounded text-[12.5px] font-bold text-white shrink-0 ${r.class === 'Intercity' ? 'bg-sky-600' : 'bg-brand-500'}`}
                  >
                    {r.line}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-ink-900 truncate">
                      → {destinationFromTerminal(r, term.id)}
                    </p>
                    <p className="text-[12px] text-ink-500 truncate">
                      {op?.name} · {r.km} km
                    </p>
                  </div>
                  <p className="text-[13.5px] font-semibold text-brand-700 shrink-0">
                    <span className="text-[11px] font-normal text-ink-400">{t('common.fromPrice')} </span>
                    {MMK(r.fare).replace(' MMK', '')}
                  </p>
                </div>
              </Link>
            )
          })}
          {serving.length === 0 && (
            <p className="text-[13px] text-ink-400">No scheduled lines registered at this terminal yet.</p>
          )}
        </div>

        {arrivingHere.length > 0 && (
          <>
            <p className="text-[14px] font-semibold text-ink-900 mt-5 mb-2">{t('terminal.arrivingHere')}</p>
            <div className="space-y-2">
              {arrivingHere.map((r) => (
                <div key={r.id} className="flex items-center gap-2.5 bg-ink-50 rounded-xl px-3 py-2.5">
                  <span className="px-2 py-1 rounded text-[12.5px] font-bold text-white bg-ink-400 shrink-0">
                    {r.line}
                  </span>
                  <p className="flex-1 text-[13px] text-ink-600 truncate">
                    {t('terminal.from')} {stopLabel((r.terminals || [])[0])}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-5 flex items-center gap-2 text-[13px] text-ink-500">
          <Phone size={13} />
          {term.contact}
        </div>
        <p className="text-[12.5px] text-ink-400 mt-2">
          Operators serving this terminal:{' '}
          {term.operators
            .map((o) => (db.operators || []).find((x) => x.id === o)?.short)
            .filter(Boolean)
            .join(', ')}
        </p>
      </div>
    </div>
  )
}
