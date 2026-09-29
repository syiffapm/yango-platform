import { useMemo } from 'react'
import { useDb } from '../../lib/store.jsx'
import { useSession } from '../../lib/session.jsx'
import { operators } from '../../data/org.js'
import { routes } from '../../data/geo.js'

/** Scopes every operator-portal page to the signed-in company. An operator only ever sees its own data. */
export default function useOperator() {
  const { db, update, audit, notify } = useDb()
  const [ses, setSes] = useSession('operator')
  const list = db.operators || operators
  const op = list.find((o) => o.id === ses.operator) || list[0]

  return useMemo(
    () => ({
      db,
      update,
      audit,
      notify,
      ses,
      setSes,
      op,
      vehicles: db.vehicles.filter((v) => v.operator === op.id),
      drivers: db.drivers.filter((d) => d.operator === op.id),
      routes: routes.filter((r) => (r.operators || [r.operator]).includes(op.id)),
      trips: db.trips.filter((t) => t.operator === op.id),
      departures: db.departures.filter((d) => d.operator === op.id),
      permits: db.permits.filter((p) => p.holder === op.id || p.operator === op.id),
      incidents: db.incidents.filter((i) => i.operator === op.id),
      findings: db.findings.filter((f) => f.operator === op.id),
      settlements: db.settlements.filter((s) => s.operator === op.id),
      campaigns: db.campaigns.filter((c) => c.advertiser === op.name),
      reviews: db.reviews.filter((r) => r.operator === op.id),
      maintenance: db.maintenance.filter((m) => m.operator === op.id),
      users: db.poUsers.filter((u) => u.operator === op.id),
      tickets: db.tickets.filter((t) => t.operator === op.id),
    }),
    [db, update, audit, notify, ses, setSes, op],
  )
}
