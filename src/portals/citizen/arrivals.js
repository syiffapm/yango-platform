import { routes, stops, terminals } from '../../data/geo.js'

const R = 6371
const toRad = (d) => (d * Math.PI) / 180

export function distanceKm(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

export const occupancyLabel = (pct) => (pct == null ? 'Unknown' : pct < 45 ? 'Empty' : pct < 80 ? 'Some seats' : 'Full')

export const occupancyTone = (pct) => (pct == null ? 'slate' : pct < 45 ? 'green' : pct < 80 ? 'amber' : 'red')

/** The stops of a route as points, in running order. */
function pointsOf(route) {
  return route.stops
    .map((sid) => stops.find((s) => s.id === sid) || terminals.find((t) => t.id === sid))
    .filter(Boolean)
}

/**
 * How far a bus still has to drive before it reaches a stop, measured along the
 * line it is running — not in a straight line. A bus that has already passed
 * the stop on this run is not an arrival at all, which is why the caller drops
 * a null.
 */
function remainingKm(route, vehicle, stopIndex) {
  const pts = pointsOf(route)
  if (pts.length < 2 || stopIndex < 1) return null
  const segs = pts.length - 1
  const here = (vehicle.progress ?? 0) * segs // fractional segment index
  if (here > stopIndex - 0.02) return null // already gone past
  let km = 0
  const seg = Math.min(Math.floor(here), segs - 1)
  km += distanceKm(vehicle, pts[seg + 1])
  for (let i = seg + 1; i < stopIndex; i++) km += distanceKm(pts[i], pts[i + 1])
  return { km, stopsBetween: Math.max(0, stopIndex - seg - 1) }
}

/** Arrivals at a stop, derived from live vehicle positions on the lines that serve it. */
export function arrivalsAt(stopId, liveVehicles) {
  const stop = stops.find((s) => s.id === stopId) || terminals.find((t) => t.id === stopId)
  if (!stop) return []
  const serving = routes.filter((r) => r.stops.includes(stopId))
  return serving
    .flatMap((r) => {
      const idx = r.stops.indexOf(stopId)
      return liveVehicles
        .filter((v) => v.route === r.id && v.lat != null && v.transmitting)
        .map((v) => {
          const rem = remainingKm(r, v, idx)
          if (!rem) return null
          // driving time plus a short dwell at each stop it still has to serve
          const etaMin = Math.max(1, Math.round((rem.km / Math.max(10, v.speedKph)) * 60 + rem.stopsBetween * 0.5))
          if (etaMin > 90) return null
          return {
            id: `${r.id}-${v.id}`,
            route: r,
            vehicle: v,
            km: rem.km,
            etaMin,
            destination: destinationOf(r),
            occupancyPct: v.occupancyPct,
          }
        })
        .filter(Boolean)
    })
    .sort((a, b) => a.etaMin - b.etaMin)
    .slice(0, 8)
}

export function destinationOf(route) {
  if (route.destination) return route.destination
  const last = route.stops[route.stops.length - 1]
  return (stops.find((s) => s.id === last) || terminals.find((t) => t.id === last))?.name || route.name
}

export function nearestStops(from, limit = 5) {
  return [...stops]
    .map((s) => ({ ...s, km: distanceKm(from, s) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit)
}

/** Nearest boarding places of any kind — a stop or a terminal, whichever is closer. */
export function nearestPlaces(from, limit = 6) {
  const all = [...stops.map((s) => ({ ...s, kind: 'stop' })), ...terminals.map((t) => ({ ...t, kind: 'terminal' }))]
  return all
    .map((p) => ({
      ...p,
      km: distanceKm(from, p),
      lines: routes.filter((r) => r.stops.includes(p.id) || (r.terminals || []).includes(p.id)),
    }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit)
}

/** Soonest arrival at a place, used to label a stop in a list. */
export function nextArrivalAt(placeId, liveVehicles) {
  const list = arrivalsAt(placeId, liveVehicles)
  return list.length ? list[0] : null
}

/**
 * Multi-leg journey planner over the stop graph. Direct routes first, then one
 * transfer. Returns options ranked by total time.
 */
export function planJourney(fromStopId, toStopId) {
  if (!fromStopId || !toStopId || fromStopId === toStopId) return []
  const options = []

  const legTime = (route, a, b) => {
    const ia = route.stops.indexOf(a),
      ib = route.stops.indexOf(b)
    const hops = Math.abs(ib - ia)
    return Math.max(3, Math.round(((hops * (route.km / Math.max(1, route.stops.length - 1))) / 18) * 60))
  }

  routes.forEach((r) => {
    const ia = r.stops.indexOf(fromStopId),
      ib = r.stops.indexOf(toStopId)
    if (ia >= 0 && ib >= 0 && ia !== ib) {
      options.push({
        id: `d-${r.id}`,
        transfers: 0,
        legs: [{ route: r, from: fromStopId, to: toStopId, minutes: legTime(r, fromStopId, toStopId) }],
        fare: r.fare,
        walkMin: 4,
        minutes: legTime(r, fromStopId, toStopId) + (r.headwayMin || 10) / 2,
      })
    }
  })

  routes.forEach((r1) => {
    if (r1.stops.indexOf(fromStopId) < 0) return
    routes.forEach((r2) => {
      if (r1.id === r2.id || r2.stops.indexOf(toStopId) < 0) return
      const shared = r1.stops.filter((s) => r2.stops.includes(s) && s !== fromStopId && s !== toStopId)
      if (!shared.length) return
      const x = shared[0]
      if (options.some((o) => o.transfers === 0)) {
        // still offer one transfer alternative, but only one
        if (options.filter((o) => o.transfers === 1).length >= 2) return
      }
      const m1 = legTime(r1, fromStopId, x),
        m2 = legTime(r2, x, toStopId)
      options.push({
        id: `t-${r1.id}-${r2.id}`,
        transfers: 1,
        legs: [
          { route: r1, from: fromStopId, to: x, minutes: m1 },
          { route: r2, from: x, to: toStopId, minutes: m2 },
        ],
        fare: Math.max(r1.fare, r2.fare),
        walkMin: 6,
        minutes: m1 + m2 + 6 + (r1.headwayMin || 10) / 2,
      })
    })
  })

  return options
    .sort((a, b) => a.minutes - b.minutes)
    .filter(
      (o, i, arr) =>
        arr.findIndex((x) => x.legs.map((l) => l.route.id).join() === o.legs.map((l) => l.route.id).join()) === i,
    )
    .slice(0, 5)
}
