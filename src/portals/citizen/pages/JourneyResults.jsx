import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Footprints, Repeat, Wallet } from 'lucide-react'
import { AppBar } from '../../../components/layout/MobileShell.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import { planJourney } from '../arrivals.js'
import { stops, terminals, isScheduled } from '../../../data/geo.js'
import { MMK } from '../../../lib/format.js'
import { useDb } from '../../../lib/store.jsx'
const nameOf = (id) => [...stops, ...terminals].find((s) => s.id === id)?.name || id
export default function JourneyResults() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { db } = useDb()
  const from = params.get('from'),
    to = params.get('to')
  const when = params.get('when') || 'now'
  const options = planJourney(from, to)
  const sponsored = db.campaigns.find((c) => c.slot === 'sponsored_result' && c.status === 'live')
  return (
    <div>
      <AppBar
        title={`${nameOf(from)} → ${nameOf(to)}`}
        subtitle={`${options.length} option${options.length === 1 ? '' : 's'} · ${
          when === 'now'
            ? 'leaving now'
            : `leaving ${new Date(when).toLocaleString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
        }`}
        back
      />

      <div className="p-4 space-y-3">
        {options.length === 0 && (
          <Empty
            title="No route found"
            hint="This search is logged anonymously and appears in the authority's unserved-demand analysis, which drives new corridors."
            action={
              <Link to="/citizen/search" className="text-[13.5px] text-brand-700 underline">
                Try another destination
              </Link>
            }
          />
        )}

        {options.map((o, i) => {
          const scheduled = isScheduled(o.legs[0].route)
          return (
            <button
              key={o.id}
              onClick={() => nav(`/citizen/book/${o.legs[0].route.id}?when=${encodeURIComponent(when)}`)}
              className="w-full text-left bg-white rounded-xl border border-ink-200 p-3.5 active:bg-ink-50"
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {o.legs.map((l, li) => (
                    <span key={li} className="inline-flex items-center gap-1.5">
                      {li > 0 && <Repeat size={11} className="text-ink-300" />}
                      <span
                        className={`px-1.5 py-0.5 rounded text-[12.5px] font-bold text-white ${l.route.class === 'BRT' ? 'bg-brand-600' : l.route.class === 'Intercity' ? 'bg-sky-600' : 'bg-brand-500'}`}
                      >
                        {l.route.line}
                      </span>
                    </span>
                  ))}
                  {i === 0 && <Badge tone="green">Fastest</Badge>}
                </div>
                <span className="text-[15px] font-semibold text-ink-900 tabular-nums">
                  {Math.round(o.minutes)}
                  <span className="text-[11.5px] font-normal text-ink-400 ml-0.5">min</span>
                </span>
              </div>

              <div className="space-y-1.5">
                {o.legs.map((l, li) => (
                  <div key={li} className="flex items-center gap-2 text-[13px] text-ink-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                    <span className="truncate">{nameOf(l.from)}</span>
                    <ArrowRight size={11} className="text-ink-300 shrink-0" />
                    <span className="truncate">{nameOf(l.to)}</span>
                    <span className="ml-auto text-ink-400 tabular-nums shrink-0">{l.minutes} min</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-ink-100">
                <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-500">
                  <Footprints size={12} />
                  {o.walkMin} min walk
                </span>
                <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-500">
                  <Repeat size={12} />
                  {o.transfers} transfer{o.transfers === 1 ? '' : 's'}
                </span>
                <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-500">
                  <Clock size={12} />
                  every {o.legs[0].route.headwayMin || '—'} min
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-[14px] font-semibold text-brand-700">
                  <Wallet size={13} />
                  {MMK(o.fare)}
                </span>
              </div>
            </button>
          )
        })}

        {sponsored && options.length > 0 && (
          <div className="bg-white rounded-xl border border-ink-200 p-3.5">
            <Badge tone="slate">Sponsored</Badge>
            <p className="text-[13.5px] font-medium text-ink-900 mt-1.5">{sponsored.advertiser}</p>
            <p className="text-[12.5px] text-ink-500">Shops near Hledan Junction — 10% off with your bus ticket.</p>
          </div>
        )}

        <p className="text-[12px] text-ink-400 leading-relaxed pt-2">
          Searches are logged without identifying you. Where no route exists, the search feeds the authority's
          unserved-demand map so the gap can be planned for.
        </p>
      </div>
    </div>
  )
}
