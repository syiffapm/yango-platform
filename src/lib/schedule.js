import { routes, stops, terminals } from '../data/geo.js'
import { seatTemplates } from '../data/org.js'

const D = 86400000
const startOfDay = (offset = 0) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime() + offset * D
}

const hash = (s) => {
  let h = 2166134261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Seats already taken on a city departure — derived, so no storage is needed. */
function derivedSold(id, capacity) {
  const h = hash(id)
  const taken = h % Math.max(1, Math.floor(capacity * 0.55))
  const out = []
  for (let i = 0; i < taken; i++) out.push(1 + (((h >>> (i % 11)) + i * 7) % capacity))
  return [...new Set(out)]
}

/**
 * One departure list for every service class.
 *
 * Intercity services have real, stored departures with a sold-seat ledger.
 * City services run to a headway, so their departures are derived from the
 * timetable at read time — the passenger still picks a time and a seat, but no
 * timetable is duplicated into storage.
 */
export function departuresFor(routeId, dayOffset, db) {
  const route = routes.find((r) => r.id === routeId)
  if (!route) return []

  if (route.class === 'Intercity') {
    const target = new Date(startOfDay(dayOffset))
    return db.departures
      .filter((d) => d.route === routeId && new Date(d.depart).toDateString() === target.toDateString())
      .sort((a, b) => new Date(a.depart) - new Date(b.depart))
      .map((d) => ({ ...d, synthetic: false }))
  }

  const [openAt, closeAt] = route.hours.split('–')
  const [oh, om] = openAt.split(':').map(Number)
  const [ch, cm] = closeAt.split(':').map(Number)
  const base = startOfDay(dayOffset)
  const first = base + oh * 3600000 + om * 60000
  const last = base + ch * 3600000 + cm * 60000
  const step = (route.headwayMin || 10) * 60000

  const fleet = db.vehicles.filter((v) => v.route === routeId && v.status === 'active')
  const runMin = Math.round((route.km / 18) * 60)
  const out = []

  for (let t = first, i = 0; t <= last; t += step, i++) {
    const vehicle = fleet[i % Math.max(1, fleet.length)]
    if (!vehicle) break
    const layout = vehicle.seatLayout || 'urban-40'
    const capacity = seatTemplates[layout]?.capacity || vehicle.capacity || 40
    const id = `${routeId}-D${dayOffset}-${new Date(t).toTimeString().slice(0, 5).replace(':', '')}`
    out.push({
      id,
      synthetic: true,
      route: routeId,
      operator: route.operator,
      vehicle: vehicle.id,
      driver: db.drivers.find((d) => d.vehicle === vehicle.id)?.id,
      depart: new Date(t).toISOString(),
      arrive: new Date(t + runMin * 60000).toISOString(),
      fare: route.fare,
      seatLayout: layout,
      capacity,
      soldSeats: derivedSold(id, capacity),
      heldSeats: [],
      boardingPoints: [route.stops[0]],
      droppingPoints: [route.stops[route.stops.length - 1]],
      bay: null,
      status: 'scheduled',
    })
  }
  return out
}

/** The next few departures on a route, across today and tomorrow. */
export function nextDepartures(routeId, db, limit = 6) {
  const now = Date.now()
  const out = []
  for (let day = 0; day < 3 && out.length < limit; day++) {
    out.push(...departuresFor(routeId, day, db).filter((d) => new Date(d.depart).getTime() > now - 60000))
  }
  return out.slice(0, limit)
}

/** A departure by id, whichever kind it is. */
export function findDeparture(depId, db) {
  const stored = db.departures.find((d) => d.id === depId)
  if (stored) return { ...stored, synthetic: false }
  const m = /^(R\d+)-D(\d+)-(\d{4})$/.exec(depId || '')
  if (!m) return null
  return departuresFor(m[1], Number(m[2]), db).find((d) => d.id === depId) || null
}

export const seatsSoldFor = (dep, db) =>
  dep.synthetic
    ? [...dep.soldSeats, ...db.tickets.filter((t) => t.departureId === dep.id).flatMap((t) => t.seats || [])]
    : dep.soldSeats

export const isSeatReserved = (dep) => {
  const route = routes.find((r) => r.id === dep.route)
  return route?.class === 'Intercity'
}

const stopName = (id) => (stops.find((x) => x.id === id) || terminals.find((x) => x.id === id))?.name

/**
 * Where a line goes when you board it at this terminal. Intercity lines use their destination;
 * a two-way city line that ends at this terminal runs back towards its first stop.
 */
export function destinationFromTerminal(r, terminalId) {
  // The published destination only holds when you are standing at the origin.
  // Seen from the far end of the line, the bus goes back the other way.
  const ends = r.terminals || []
  if (r.destination && ends[0] === terminalId) return r.destination
  if (ends.length > 1 && ends[ends.length - 1] === terminalId) return stopName(ends[0])
  if (r.destination) return r.destination
  const term = terminals.find((t) => t.id === terminalId)
  const lastIdx = r.stops.length - 1
  if (!term) return stopName(r.stops[lastIdx])
  const dist = (id) => {
    const x = stops.find((y) => y.id === id)
    return x ? (x.lat - term.lat) ** 2 + (x.lng - term.lng) ** 2 : Infinity
  }
  const nearest = r.stops.reduce((best, id) => (dist(id) < dist(best) ? id : best), r.stops[0])
  return r.stops.indexOf(nearest) === lastIdx && r.stops[0] !== r.stops[lastIdx]
    ? stopName(r.stops[0])
    : stopName(r.stops[lastIdx])
}

/**
 * Everything leaving a terminal soon: stored intercity departures that board there, plus the next
 * city-line departures (derived from each line's headway) for lines registered at the terminal.
 */
export function terminalDepartures(
  terminalId,
  db,
  { limit = 12, now = Date.now(), perCityLine = 2, includeDepartedMin = 0 } = {},
) {
  const intercity = db.departures
    .filter(
      (d) => d.boardingPoints.includes(terminalId) && new Date(d.depart).getTime() > now - includeDepartedMin * 60000,
    )
    .map((d) => ({ ...d, kind: 'intercity' }))
  const towardFrom = (r) => destinationFromTerminal(r, terminalId)
  const city = routes
    .filter((r) => r.class !== 'Intercity' && (r.terminals || []).includes(terminalId))
    .flatMap((r) =>
      nextDepartures(r.id, db, perCityLine + 1)
        .filter((d) => new Date(d.depart).getTime() > now - includeDepartedMin * 60000)
        .slice(0, perCityLine)
        .map((d) => ({ ...d, kind: 'city', headwayMin: r.headwayMin, toward: towardFrom(r) })),
    )
  return [...intercity, ...city].sort((a, b) => new Date(a.depart) - new Date(b.depart)).slice(0, limit)
}
