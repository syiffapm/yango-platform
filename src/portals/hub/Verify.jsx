import { Link, useParams } from 'react-router-dom'
import { BadgeCheck, ShieldAlert, ArrowLeft } from 'lucide-react'
import { useDb } from '../../lib/store.jsx'
import { dateOnly, daysUntil } from '../../lib/format.js'
import Qr from '../../components/ui/Qr.jsx'
import Badge, { StatusPill } from '../../components/ui/Badge.jsx'
import { licenceTypes } from '../../data/org.js'

/** public verification page. No personal data beyond name and photo. */
export default function Verify() {
  const { id } = useParams()
  const { db } = useDb()
  const permit =
    db.permits.find((p) => p.id === id) ||
    db.permits.find((p) => p.id.startsWith(`${id}-`)) ||
    db.permits.find((p) => p.routeId && `PM-RTE-${p.routeId}` === id)
  const type = permit && licenceTypes.find((t) => t.code === permit.type)
  const ok = permit && permit.status === 'valid' && daysUntil(permit.expiry) > 0
  return (
    <div className="min-h-screen bg-ink-100 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] text-ink-500 hover:text-ink-800 mb-3">
          <ArrowLeft size={14} /> YanGo
        </Link>
        <div className="bg-white rounded-2xl border border-ink-200 overflow-hidden shadow-sm">
          <div className={`px-5 py-4 flex items-center gap-3 ${ok ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
            {ok ? <BadgeCheck size={24} /> : <ShieldAlert size={24} />}
            <div>
              <p className="text-[15px] font-semibold leading-tight">
                {ok ? 'Licence valid' : permit ? 'Licence not valid' : 'Permit not found'}
              </p>
              <p className="text-[12.5px] opacity-85">Verified against the national permit register</p>
            </div>
          </div>

          {permit ? (
            <div className="p-5">
              <div className="flex items-start gap-4">
                <Qr value={permit.id} size={104} className="border border-ink-200 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-ink-400">{type?.label || permit.type}</p>
                  <p className="text-[16px] font-semibold text-ink-900 mt-0.5 leading-tight">{permit.holderName}</p>
                  {permit.routeLabel && <p className="text-[12px] text-ink-500 mt-0.5">{permit.routeLabel}</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <StatusPill status={permit.status} />
                    <Badge tone="slate">v{permit.version}</Badge>
                  </div>
                </div>
              </div>

              <dl className="mt-5 divide-y divide-ink-100 border-t border-ink-100">
                {[
                  ['Permit number', permit.id],
                  ['Issued', dateOnly(permit.issued)],
                  ['Valid until', `${dateOnly(permit.expiry)} (${daysUntil(permit.expiry)} days)`],
                  permit.terms?.hours && ['Permitted hours', permit.terms.hours],
                  permit.terms?.minHeadwayMin && ['Minimum headway', `${permit.terms.minHeadwayMin} min`],
                  permit.terms?.vehiclesRequired && [
                    'Vehicles required',
                    `${permit.terms.vehiclesRequired} (held ${permit.terms.vehiclesHeld})`,
                  ],
                  permit.terms?.class && ['Class', permit.terms.class],
                ]
                  .filter(Boolean)
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-2">
                      <dt className="text-[12.5px] text-ink-500">{k}</dt>
                      <dd className="text-[12px] text-ink-900 font-medium text-right">{v}</dd>
                    </div>
                  ))}
              </dl>

              <p className="text-[11.5px] text-ink-400 mt-4 leading-relaxed">
                This page shows licence status only. No personal data beyond the holder's name is published. Report a
                mismatch to the Yangon Region Transport Committee.
              </p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-[13px] text-ink-600">
                No permit with reference <span className="font-mono">{id}</span> is in the register.
              </p>
              <p className="text-[12.5px] text-ink-400 mt-2">
                Scan the QR on the bus windscreen or the driver card again.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
