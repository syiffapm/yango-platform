import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { loadDb, saveDb, resetDb, SLA_MIN } from './db.js'
import { routes, stops, terminals, inServiceHours } from '../data/geo.js'
import { nextId } from './id.js'
const DbCtx = createContext(null)
export function DbProvider({ children }) {
  const [db, setDb] = useState(() => loadDb())
  const saveTimer = useRef(null)
  const latest = useRef(db)
  latest.current = db

  // Debounced persistence keeps rapid edits cheap while surviving a reload.
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDb(db), 180)
    return () => clearTimeout(saveTimer.current)
  }, [db])

  // A pending write must not be lost when the tab navigates away or closes.
  useEffect(() => {
    const flush = () => {
      clearTimeout(saveTimer.current)
      saveDb(latest.current)
    }
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
    }
  }, [])

  // Another portal tab changed the shared database — pick it up.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key && e.key.startsWith('yango.db')) setDb(loadDb())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  const update = useCallback(
    (fn) =>
      setDb((prev) => {
        const draft = structuredClone(prev)
        const out = fn(draft)
        return out || draft
      }),
    [],
  )
  const audit = useCallback(
    (entry) =>
      update((d) => {
        d.audit.unshift({
          id: nextId('AU'),
          at: new Date().toISOString(),
          reason: null,
          category: 'Administration',
          ...entry,
        })
        if (d.audit.length > 400) d.audit.length = 400
      }),
    [update],
  )
  const notify = useCallback(
    (n) =>
      update((d) => {
        d.notifications.unshift({ id: nextId('NT'), at: new Date().toISOString(), read: false, ...n })
        if (d.notifications.length > 200) d.notifications.length = 200
      }),
    [update],
  )
  const reset = useCallback(() => setDb(resetDb()), [])
  const value = useMemo(() => ({ db, update, audit, notify, reset, setDb }), [db, update, audit, notify, reset])
  return <DbCtx.Provider value={value}>{children}</DbCtx.Provider>
}
export function useDb() {
  const ctx = useContext(DbCtx)
  if (!ctx) throw new Error('useDb must be used inside <DbProvider>')
  return ctx
}

/* ------------------------------------------------------------------ clock */
export function useClock(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

/* ------------------------------------------------- live telematics (AVL) */
// Vehicle positions are derived, never stored: a vehicle on a running trip
// slides along its route shape at a speed that depends on its status.
function lerp(a, b, t) {
  return a + (b - a) * t
}
export function vehiclePosition(vehicle, trip, now) {
  const route = routes.find((r) => r.id === vehicle.route)
  if (!route) return null
  // Outside service hours the bus is in the depot; there is no position to show.
  if (!inServiceHours(route, now)) return null
  const pts = route.stops
    .map((sid) => stops.find((s) => s.id === sid) || terminals.find((t) => t.id === sid))
    .filter(Boolean)
  if (pts.length < 2) return null
  const period = 1000 * 60 * (route.headwayMin ? route.headwayMin * 6 : 90)
  const seed = parseInt(vehicle.id.slice(1), 10) * 7919
  const t = ((now + seed * 1000) % period) / period
  const segs = pts.length - 1
  const f = t * segs
  const i = Math.min(Math.floor(f), segs - 1)
  const k = f - i
  const a = pts[i],
    b = pts[i + 1]
  const bearing = (Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180) / Math.PI
  return { lat: lerp(a.lat, b.lat, k), lng: lerp(a.lng, b.lng, k), bearing, nextStop: b, prevStop: a, progress: t }
}
export function vehicleStatus(vehicle, db) {
  if (vehicle.status === 'blocked') return 'blocked'
  if (vehicle.status === 'maintenance') return 'maintenance'
  const comp = db.compliance.find((c) => c.route === vehicle.route)
  const n = parseInt(vehicle.id.slice(1), 10)
  if (comp && comp.coveragePct < 20) return 'not_responding'
  if (n % 11 === 0) return 'not_responding'
  if (n % 7 === 0) return 'bunching'
  if (n % 5 === 0) return 'deviating'
  return 'on_headway'
}
export function useLiveVehicles(filter) {
  const { db } = useDb()
  const now = useClock(2000)
  return useMemo(() => {
    const list = db.vehicles
      .filter((v) => (filter?.operator ? v.operator === filter.operator : true))
      .filter((v) => (filter?.route ? v.route === filter.route : true))
    return list.map((v) => {
      const pos = vehiclePosition(v, null, now)
      const offService = !pos
      const status = offService ? 'off_service' : vehicleStatus(v, db)
      const driver = db.drivers.find((d) => d.vehicle === v.id)
      return {
        ...v,
        ...pos,
        offService,
        status,
        transmitting: !offService && status !== 'not_responding',
        speedKph: offService || status === 'not_responding' ? 0 : 14 + ((parseInt(v.id.slice(1), 10) * 13) % 26),
        occupancyPct: offService || status === 'not_responding' ? null : 20 + ((parseInt(v.id.slice(1), 10) * 17) % 78),
        driverName: driver?.name,
        driverId: driver?.id,
      }
    })
  }, [db, now, filter?.operator, filter?.route])
}

/* --------------------------------------------------------- derived values */
export function coverageIndex(db, operatorId) {
  const vs = db.vehicles.filter((v) => (operatorId ? v.operator === operatorId : true))
  const expected = vs.filter((v) => v.status !== 'maintenance').length || 1
  const transmitting = vs.filter((v) => vehicleStatus(v, db) !== 'not_responding' && v.status !== 'maintenance').length
  const pct = Math.round((transmitting / expected) * 100)
  const floors = db.thresholds.coverageFloors
  const qualifier =
    pct >= floors.full
      ? 'full'
      : pct >= floors.indicative
        ? 'indicative'
        : pct >= floors.warning
          ? 'warning'
          : 'withheld'
  return { pct, transmitting, expected, qualifier }
}
export function slaDue(incident) {
  return new Date(new Date(incident.reportedAt).getTime() + SLA_MIN[incident.priority] * 60000).toISOString()
}
export const OPEN_INCIDENT_STATES = ['new', 'acknowledged', 'forwarded', 'operator_responded', 'verified']
export function openIncidents(db, operatorId) {
  return db.incidents.filter(
    (i) => OPEN_INCIDENT_STATES.includes(i.status) && (operatorId ? i.operator === operatorId : true),
  )
}
