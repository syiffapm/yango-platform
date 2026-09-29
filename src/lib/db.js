import { routes, stops, terminals } from '../data/geo.js'
import { operators, buildVehicles, buildDrivers, licenceTypes, roles } from '../data/org.js'
import { mulberry32, int, pick } from './rng.js'

export const DB_KEY = 'yango.db.v17'
export const SCHEMA_VERSION = 11

const D = 86400000
const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
const at = (dayOffset, h, m = 0) => new Date(startOfToday() + dayOffset * D + h * 3600000 + m * 60000).toISOString()
const ago = (min) => new Date(Date.now() - min * 60000).toISOString()
const ahead = (min) => new Date(Date.now() + min * 60000).toISOString()

export const SLA_MIN = { P1: 5, P2: 15, P3: 240, P4: 4320 }

export function buildSeed() {
  const rnd = mulberry32(20260924)
  const vehicles = buildVehicles(routes)
  const drivers = buildDrivers(vehicles)

  /* ---------------------------------------------------------------- users */
  const users = [
    {
      id: 'U01',
      name: 'Daw Khin Myat',
      email: 'policy@ministry.gov.mm',
      role: 'nat_policy',
      org: 'Ministry of Transport',
      jurisdiction: 'NATIONAL',
      twoFA: true,
      lastActive: ago(14),
      status: 'active',
    },
    {
      id: 'U02',
      name: 'U Tin Maung',
      email: 'audit@ministry.gov.mm',
      role: 'nat_auditor',
      org: 'Audit Body',
      jurisdiction: 'NATIONAL',
      twoFA: true,
      lastActive: ago(220),
      status: 'active',
    },
    {
      id: 'U03',
      name: 'Daw Su Su Hlaing',
      email: 'licensing1@yrtc.gov.mm',
      role: 'lic_officer',
      org: 'YRTC',
      jurisdiction: 'YGN',
      twoFA: true,
      lastActive: ago(4),
      status: 'active',
    },
    {
      id: 'U04',
      name: 'U Zaw Min Htet',
      email: 'licensing2@yrtc.gov.mm',
      role: 'lic_approver',
      org: 'YRTC',
      jurisdiction: 'YGN',
      twoFA: true,
      lastActive: ago(31),
      status: 'active',
    },
    {
      id: 'U05',
      name: 'Daw Nwe Ni Aung',
      email: 'compliance@yrtc.gov.mm',
      role: 'compliance',
      org: 'YRTC',
      jurisdiction: 'YGN',
      twoFA: true,
      lastActive: ago(9),
      status: 'active',
    },
    {
      id: 'U06',
      name: 'U Myo Thant',
      email: 'adjudicator@yrtc.gov.mm',
      role: 'adjudicator',
      org: 'YRTC',
      jurisdiction: 'YGN',
      twoFA: true,
      lastActive: ago(120),
      status: 'active',
    },
    {
      id: 'U07',
      name: 'Daw Aye Thida',
      email: 'safety@yrtc.gov.mm',
      role: 'safety',
      org: 'YRTC',
      jurisdiction: 'YGN',
      twoFA: true,
      lastActive: ago(1),
      status: 'active',
    },
    {
      id: 'U08',
      name: 'U Kyaw Swar',
      email: 'planning@yrtc.gov.mm',
      role: 'planning',
      org: 'YRTC',
      jurisdiction: 'YGN',
      twoFA: false,
      lastActive: ago(640),
      status: 'active',
    },
    {
      id: 'U09',
      name: 'Daw Ei Mon',
      email: 'finance@yrtc.gov.mm',
      role: 'finance',
      org: 'YRTC',
      jurisdiction: 'YGN',
      twoFA: true,
      lastActive: ago(52),
      status: 'active',
    },
    {
      id: 'U10',
      name: 'U Sithu Naing',
      email: 'terminal@yrtc.gov.mm',
      role: 'terminal_mgr',
      org: 'Aung Mingalar Terminal',
      jurisdiction: 'YGN',
      twoFA: true,
      lastActive: ago(7),
      status: 'active',
    },
  ]

  const poUsers = operators.flatMap((o, i) => [
    {
      id: `PU${i}1`,
      name: `${o.short} Admin`,
      email: `admin@${o.short.toLowerCase()}.mm`,
      role: 'po_admin',
      operator: o.id,
      twoFA: true,
      lastActive: ago(12 + i),
      status: 'active',
    },
    {
      id: `PU${i}2`,
      name: `${o.short} Dispatch`,
      email: `ops@${o.short.toLowerCase()}.mm`,
      role: 'po_ops',
      operator: o.id,
      twoFA: true,
      lastActive: ago(3 + i),
      status: 'active',
    },
    {
      id: `PU${i}3`,
      name: `${o.short} Finance`,
      email: `finance@${o.short.toLowerCase()}.mm`,
      role: 'po_finance',
      operator: o.id,
      twoFA: i % 2 === 0,
      lastActive: ago(90 + i),
      status: 'active',
    },
  ])

  /* ------------------------------------------------------------- licensing */
  const permits = []
  operators.forEach((o, i) => {
    permits.push({
      id: `PM-BUS-${o.id}`,
      type: 'PO_BUSINESS',
      holderType: 'operator',
      holder: o.id,
      holderName: o.name,
      issued: `${2022 + (i % 3)}-0${(i % 9) + 1}-15`,
      expiry: `${2027 + (i % 2)}-0${(i % 9) + 1}-14`,
      status: o.licence === 'suspended' ? 'suspended' : 'valid',
      terms: { scope: 'Yangon Region' },
      version: 1,
      history: [],
    })
  })
  routes.forEach((r, i) => {
    const holders = r.operators || [r.operator]
    const perOperator = r.class === 'Intercity' ? 2 : 3
    holders.forEach((holderId, hi) => {
      const op = operators.find((o) => o.id === holderId)
      if (!op) return
      permits.push({
        id: `PM-RTE-${r.id}-${holderId}`,
        type: 'ROUTE',
        holderType: 'operator',
        holder: holderId,
        holderName: op.name,
        routeId: r.id,
        routeLabel: `${r.line} · ${r.name}`,
        issued: `2025-0${((i + hi) % 9) + 1}-10`,
        expiry: i === 5 && hi === 0 ? ahead(60 * 24 * 21) : `${2027 + ((i + hi) % 2)}-0${((i + hi) % 9) + 1}-09`,
        status: holderId === 'PO06' ? 'suspended' : 'valid',
        terms: {
          hours: r.hours,
          minHeadwayMin: r.headwayMin,
          vehiclesRequired: perOperator,
          vehiclesHeld: perOperator,
          class: r.class,
          terminals: r.terminals || [],
          sharedWith: holders.filter((h) => h !== holderId),
        },
        version: 1,
        history: [],
      })
    })
  })
  vehicles.forEach((v) => {
    permits.push({
      id: `PM-VEH-${v.id}`,
      type: 'VEHICLE',
      holderType: 'vehicle',
      holder: v.id,
      holderName: v.plate,
      operator: v.operator,
      issued: '2025-11-01',
      expiry: v.licenceExpiry,
      status: v.status === 'blocked' ? 'suspended' : 'valid',
      terms: { class: v.class, capacity: v.capacity },
      version: 1,
      history: [],
    })
  })
  drivers.forEach((d) => {
    permits.push({
      id: `PM-DRV-${d.id}`,
      type: 'DRIVER',
      holderType: 'driver',
      holder: d.id,
      holderName: d.name,
      operator: d.operator,
      issued: '2025-06-01',
      expiry: d.licenceExpiry,
      status: d.status === 'blocked' ? 'suspended' : d.status === 'pending' ? 'pending' : 'valid',
      terms: { licenceClass: d.licenceClass },
      version: 1,
      history: [],
    })
  })

  const appStates = [
    'draft',
    'submitted',
    'awaiting_payment',
    'in_review',
    'inspection',
    'awaiting_approval',
    'approved',
    'rejected',
    'revision',
  ]
  const applications = []
  const appSeed = [
    {
      type: 'ROUTE',
      operator: 'PO03',
      state: 'in_review',
      officer: 'U03',
      days: 3,
      qty: 1,
      note: 'New feeder variant to Aye Yeik Thar',
    },
    {
      type: 'VEHICLE',
      operator: 'PO01',
      state: 'awaiting_approval',
      officer: 'U03',
      days: 6,
      qty: 4,
      note: 'Fleet renewal, 4 trunk-line units',
    },
    {
      type: 'DRIVER',
      operator: 'PO05',
      state: 'awaiting_payment',
      officer: null,
      days: 1,
      qty: 2,
      note: 'Two new express drivers',
    },
    {
      type: 'ROUTE',
      operator: 'PO07',
      state: 'inspection',
      officer: 'U03',
      days: 9,
      qty: 1,
      note: 'Extension of loop 92 to Dagon Uni',
    },
    {
      type: 'VEHICLE',
      operator: 'PO08',
      state: 'submitted',
      officer: null,
      days: 0,
      qty: 2,
      note: 'Two midi buses added',
    },
    {
      type: 'PO_BUSINESS',
      operator: 'PO06',
      state: 'revision',
      officer: 'U03',
      days: 12,
      qty: 1,
      note: 'Insurance certificate expired — resubmit',
    },
    {
      type: 'DRIVER',
      operator: 'PO02',
      state: 'approved',
      officer: 'U03',
      days: 18,
      qty: 3,
      note: 'Batch driver licensing',
    },
    {
      type: 'CHARTER',
      operator: 'PO07',
      state: 'approved',
      officer: 'U03',
      days: 4,
      qty: 1,
      note: 'School charter, Bago day trip',
    },
    {
      type: 'VEHICLE',
      operator: 'PO04',
      state: 'rejected',
      officer: 'U03',
      days: 21,
      qty: 1,
      note: 'Roadworthiness test failed',
    },
    {
      type: 'ROUTE',
      operator: 'PO02',
      state: 'in_review',
      officer: 'U03',
      days: 2,
      qty: 1,
      note: 'Intercity Yangon–Bago frequency increase',
    },
    {
      type: 'CREW',
      operator: 'PO01',
      state: 'awaiting_payment',
      officer: null,
      days: 1,
      qty: 5,
      note: 'Conductor cards, 5 crew',
    },
    {
      type: 'VEHICLE',
      operator: 'PO03',
      state: 'rejected',
      officer: 'U03',
      days: 15,
      qty: 1,
      note: 'Second-hand coach, emissions test failed',
    },
    {
      type: 'DRIVER',
      operator: 'PO03',
      state: 'revision',
      officer: 'U03',
      days: 6,
      qty: 1,
      note: 'Medical certificate older than 12 months',
    },
    {
      type: 'DRIVER',
      operator: null,
      state: 'submitted',
      officer: null,
      days: 0,
      qty: 1,
      note: 'Self-registered driver, chose PO03',
      selfApply: true,
    },
  ]
  appSeed.forEach((a, i) => {
    const lt = licenceTypes.find((t) => t.code === a.type)
    const op = a.operator ? operators.find((o) => o.id === a.operator) : null
    const amount = lt.fee * a.qty
    applications.push({
      id: `APP-2026-${String(1001 + i)}`,
      type: a.type,
      typeLabel: lt.label,
      operator: a.operator,
      applicantName: op ? op.name : 'Ko Thura Aung (self-apply)',
      quantity: a.qty,
      note: a.note,
      selfApply: !!a.selfApply,
      state: a.state,
      officer: a.officer,
      approver: ['approved'].includes(a.state) ? 'U04' : null,
      submittedAt: ago(a.days * 1440 + int(rnd, 0, 400)),
      slaDueAt: ahead((5 - a.days) * 1440),
      fee: amount,
      paid: !['awaiting_payment', 'draft'].includes(a.state),
      invoiceId: `INV-L-${5200 + i}`,
      documents: lt.docs.map((d, di) => ({
        name: d,
        status: a.state === 'revision' && di === 4 ? 'rejected' : 'verified',
        uploadedAt: ago(a.days * 1440 + 60),
        ocr: { expiry: '2027-03-31' },
        size: `${int(rnd, 240, 3400)} KB`,
      })),
      checklist: lt.docs.map((d, di) => ({
        item: `Verify ${d.toLowerCase()}`,
        result: a.state === 'revision' && di === 4 ? 'fail' : a.officer ? 'pass' : null,
        comment: '',
      })),
      inspection:
        a.state === 'inspection'
          ? {
              scheduledAt: ahead(1440),
              inspector: 'U03',
              location: 'Aung Mingalar ramp bay 3',
              result: null,
              photos: [],
            }
          : a.state === 'approved'
            ? {
                scheduledAt: ago(a.days * 1440 - 600),
                inspector: 'U03',
                location: 'Aung Mingalar ramp bay 3',
                result: 'pass',
                photos: [],
              }
            : null,
      registryChecks: [
        { registry: 'National ID', result: 'match', ref: 'NRC-OK' },
        { registry: 'Driving licence', result: a.type === 'DRIVER' ? 'match' : 'n/a', ref: 'DL-OK' },
        { registry: 'Vehicle registry', result: a.type === 'VEHICLE' ? 'match' : 'n/a', ref: 'VR-OK' },
        { registry: 'Company registry', result: 'match', ref: 'DICA-OK' },
        {
          registry: 'Duplicate detection',
          result: i === 8 ? 'flag' : 'clear',
          ref: i === 8 ? 'Chassis seen at PO02' : '—',
        },
      ],
      decision:
        a.state === 'approved'
          ? {
              by: 'U04',
              at: ago(a.days * 1440 - 300),
              reason: 'All checklist items passed; inspection passed; fee settled.',
            }
          : a.state === 'rejected'
            ? {
                by: 'U04',
                at: ago(a.days * 1440 - 300),
                reason: 'Roadworthiness certificate failed brake test — reapply after re-test.',
              }
            : a.state === 'revision'
              ? {
                  by: 'U03',
                  at: ago(a.days * 1440 - 200),
                  reason: 'Insurance certificate expired on 2026-08-31. Upload a valid policy.',
                }
              : null,
      timeline: [{ at: ago(a.days * 1440 + 400), actor: 'Applicant', action: 'Application created' }],
      appeal:
        a.state === 'rejected' && a.operator === 'PO03'
          ? {
              at: ago(a.days * 1440 - 900),
              reason:
                'The coach passed an independent emissions test two days after the inspection; the certificate is attached and we ask for the refusal to be reviewed.',
              status: 'submitted',
              adjudicator: null,
              ruling: null,
            }
          : undefined,
    })
  })

  /* ------------------------------------------------------------------ trips */
  const trips = []
  routes
    .filter((r) => r.class !== 'Intercity')
    .forEach((r) => {
      const veh = vehicles.filter((v) => v.route === r.id)
      if (!veh.length) return
      const [oh] = r.hours.split('–')
      const startH = parseInt(oh.split(':')[0], 10)
      for (let i = 0; i < 14; i++) {
        const v = veh[i % veh.length]
        const drv = drivers.find((d) => d.vehicle === v.id)
        const plannedStart = at(0, startH + Math.floor((i * r.headwayMin) / 60), (i * r.headwayMin) % 60)
        const started = new Date(plannedStart).getTime() < Date.now()
        const delayMin = i % 5 === 0 ? int(rnd, 4, 17) : int(rnd, -2, 3)
        trips.push({
          id: `TR-${r.id}-${String(i + 1).padStart(2, '0')}`,
          route: r.id,
          operator: r.operator,
          vehicle: v.id,
          driver: drv?.id,
          plannedStart,
          plannedEnd: new Date(new Date(plannedStart).getTime() + (r.km / 18) * 3600000).toISOString(),
          actualStart: started ? new Date(new Date(plannedStart).getTime() + delayMin * 60000).toISOString() : null,
          actualEnd:
            started && i < 8
              ? new Date(new Date(plannedStart).getTime() + (r.km / 18) * 3600000 + delayMin * 60000).toISOString()
              : null,
          status: !started ? 'scheduled' : i < 8 ? 'completed' : 'running',
          delayMin,
          boarded: started ? int(rnd, 8, 38) : 0,
          capacity: v.capacity,
          headwayActualMin: r.headwayMin + (i % 4 === 0 ? int(rnd, 1, 5) : 0),
        })
      }
    })

  // intercity departures for the next 14 days
  const departures = []
  const depTimes = {
    R11: ['07:00', '10:30', '14:00', '18:30'],
    R12: ['06:30', '13:00', '20:00'],
    R13: ['16:00', '18:00', '20:30'],
    R14: ['07:30', '15:30'],
    R20: ['06:00', '13:30', '21:00'],
    R21: ['06:15', '08:45', '11:30', '14:15', '17:00', '19:30'],
    R22: ['07:00', '12:30', '20:15'],
    R23: ['05:00', '06:30', '08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00', '21:30'],
    R24: ['06:00', '09:00', '13:00', '19:00'],
    R25: ['07:00', '12:00', '17:30'],
    R26: ['06:30', '10:00', '15:00', '20:30'],
    // return services from the outer terminals
    R27: ['05:30', '07:45', '10:15', '13:00', '16:00', '18:45'],
    R28: ['06:00', '09:15', '12:45', '15:45', '19:15'],
    R29: ['07:30', '19:00', '21:00'],
    R30: ['06:00', '17:30', '19:30', '21:00'],
    R31: ['07:15', '11:45', '16:30'],
    R32: ['06:45', '09:30', '14:30'],
  }
  routes
    .filter((r) => r.class === 'Intercity')
    .forEach((r) => {
      const veh = vehicles.filter((v) => v.route === r.id)
      if (!veh.length || !depTimes[r.id]) return
      for (let day = 0; day < 14; day++) {
        depTimes[r.id].forEach((t, ti) => {
          const [h, m] = t.split(':').map(Number)
          const v = veh[ti % veh.length]
          const drv = drivers.find((d) => d.vehicle === v.id)
          const sold = day === 0 ? int(rnd, 18, 40) : int(rnd, 2, 30)
          departures.push({
            id: `DEP-${r.id}-D${day}-${ti}`,
            route: r.id,
            operator: r.operator,
            vehicle: v.id,
            driver: drv?.id,
            depart: at(day, h, m),
            arrive: at(day, h + Math.round(r.km / 55), m),
            fare: r.fare + (v.seatLayout === 'coach-2-1' ? 3000 : 0),
            seatLayout: v.seatLayout,
            capacity: v.capacity,
            // Scattered, the way a coach actually fills — not a solid block from row 1.
            soldSeats: Array.from(
              { length: Math.min(sold, v.capacity - 4) },
              (_, k) => ((k * 7 + day * 3 + h) % v.capacity) + 1,
            ).filter((n, i, a) => a.indexOf(n) === i),
            heldSeats: [],
            // Kerbside pick-up at Sule only applies to services that start in Yangon.
            boardingPoints: [
              r.terminals?.[0] || 'T01',
              ...(['T01', 'T02', 'T03'].includes(r.terminals?.[0]) ? ['S01'] : []),
            ],
            droppingPoints: [r.terminals?.[1] || r.stops[r.stops.length - 1] || 'T02'],
            bay: null,
            status: 'scheduled',
          })
        })
      }
    })

  /* --------------------------------------------------------------- tickets */
  const tickets = [
    {
      id: 'TK-1001',
      kind: 'urban',
      route: 'R01',
      operator: 'PO01',
      fare: 400,
      qty: 1,
      passenger: 'Demo Citizen',
      phone: '+95 9 7700 1234',
      purchasedAt: ago(140),
      validUntil: at(0, 23, 59),
      status: 'used',
      usedAt: ago(120),
      pnr: 'K7M4QX',
      vehicle: 'V001',
    },
    {
      id: 'TK-1002',
      kind: 'urban',
      route: 'R03',
      operator: 'PO03',
      fare: 400,
      qty: 2,
      passenger: 'Demo Citizen',
      phone: '+95 9 7700 1234',
      purchasedAt: ago(35),
      validUntil: at(0, 23, 59),
      status: 'active',
      pnr: 'B2R9TL',
      vehicle: null,
    },
    {
      id: 'TK-1003',
      kind: 'scheduled',
      route: 'R11',
      operator: 'PO02',
      fare: 4500,
      qty: 1,
      passenger: 'Demo Citizen',
      phone: '+95 9 7700 1234',
      purchasedAt: ago(2880),
      departureId: 'DEP-R11-D1-1',
      seats: [12],
      boardingPoint: 'T01',
      droppingPoint: 'T02',
      status: 'booked',
      pnr: 'Z8H3VN',
      vehicle: null,
    },
  ]

  /* -------------------------------------------------------------- incidents */
  const incCat = [
    'Harassment',
    'Reckless driving',
    'Dangerous overcrowding',
    'Vehicle condition',
    'Accessibility',
    'Accident',
    'Breakdown',
    'Medical',
    'Robbery',
  ]
  const incidents = []
  const incSeed = [
    {
      pri: 'P1',
      cat: 'Medical',
      src: 'passenger',
      status: 'acknowledged',
      min: 3,
      route: 'R01',
      veh: 'V001',
      sos: true,
    },
    { pri: 'P1', cat: 'Accident', src: 'driver', status: 'forwarded', min: 26, route: 'R05', veh: 'V013', sos: true },
    { pri: 'P2', cat: 'Reckless driving', src: 'passenger', status: 'new', min: 8, route: 'R04', veh: 'V011' },
    {
      pri: 'P2',
      cat: 'Dangerous overcrowding',
      src: 'system',
      status: 'operator_responded',
      min: 95,
      route: 'R02',
      veh: 'V005',
    },
    { pri: 'P3', cat: 'Vehicle condition', src: 'passenger', status: 'verified', min: 300, route: 'R08', veh: 'V026' },
    { pri: 'P3', cat: 'Accessibility', src: 'passenger', status: 'new', min: 40, route: 'R03', veh: 'V008' },
    { pri: 'P4', cat: 'Harassment', src: 'passenger', status: 'forwarded', min: 1500, route: 'R09', veh: 'V028' },
    { pri: 'P2', cat: 'Breakdown', src: 'driver', status: 'closed', min: 2600, route: 'R06', veh: 'V018' },
    { pri: 'P3', cat: 'Reckless driving', src: 'operator', status: 'closed', min: 4000, route: 'R07', veh: 'V021' },
    { pri: 'P1', cat: 'Robbery', src: 'passenger', status: 'closed', min: 5600, route: 'R10', veh: 'V031', sos: true },
  ]
  incSeed.forEach((s, i) => {
    const r = routes.find((x) => x.id === s.route)
    const st = stops.find((x) => x.id === r.stops[1]) || stops[0]
    incidents.push({
      id: `INC-${2601 + i}`,
      ref: `REF-${8800 + i}`,
      priority: s.pri,
      category: s.cat,
      source: s.src,
      isSOS: !!s.sos,
      route: s.route,
      vehicle: s.veh,
      operator: r.operator,
      lat: st.lat + (rnd() - 0.5) * 0.01,
      lng: st.lng + (rnd() - 0.5) * 0.01,
      location: st.name,
      reportedAt: ago(s.min),
      status: s.status,
      owner: ['new'].includes(s.status) ? null : 'U07',
      slaDueAt: new Date(new Date(ago(s.min)).getTime() + SLA_MIN[s.pri] * 60000).toISOString(),
      acknowledgedAt: s.status === 'new' ? null : ago(s.min - 2),
      description: `${s.cat} reported on ${r.line} near ${st.name}.`,
      anonymous: s.src === 'passenger' && i % 2 === 0,
      evidence: s.sos ? ['audio-clip-12s.m4a', 'dashcam-30s.mp4'] : [],
      dispatch: s.sos ? { police: s.pri === 'P1', ambulance: s.cat === 'Medical', at: ago(s.min - 1) } : null,
      operatorResponse: ['operator_responded', 'verified', 'closed'].includes(s.status)
        ? {
            at: ago(s.min - 40),
            by: 'PO dispatcher',
            reason: 'Driver interviewed, vehicle inspected on return to depot. Corrective briefing issued.',
          }
        : null,
      closure:
        s.status === 'closed'
          ? { at: ago(s.min - 120), by: 'U07', reason: 'Operator action verified; no further risk to passengers.' }
          : null,
      timeline: [],
    })
  })

  /* ------------------------------------------------------------- compliance */
  const dims = ['coverage', 'operating_hours', 'frequency', 'route_coverage', 'fleet_availability', 'service_standard']
  const schedDims = [
    'on_time_departure',
    'on_time_arrival',
    'trip_completion',
    'route_adherence',
    'fleet_availability',
    'service_standard',
  ]
  const compliance = routes.map((r, i) => {
    const cov = r.operator === 'PO06' ? 18 : i === 6 ? 42 : int(rnd, 62, 98)
    const use = r.class === 'Intercity' ? schedDims : dims
    return {
      route: r.id,
      operator: r.operator,
      operators: r.operators || [r.operator],
      coveragePct: cov,
      dimensions: use.map((d, di) => {
        const measurable = cov >= 50 || d === 'coverage'
        const required = d === 'frequency' ? r.headwayMin : 100
        // Most lines meet the standard; breaches are the exception a regulator chases.
        const measured = d === 'frequency' ? r.headwayMin + (i % 6 === 0 ? int(rnd, 1, 4) : 0) : int(rnd, 83, 101)
        const breach = measurable && (d === 'frequency' ? measured > required * 1.06 : measured < 85)
        return {
          key: d,
          measurable,
          required,
          measured,
          breach,
          unit: d === 'frequency' ? 'min headway' : '% of standard',
        }
      }),
    }
  })

  const findings = [
    {
      id: 'FND-4401',
      route: 'R04',
      operator: 'PO04',
      dimension: 'frequency',
      measured: 13,
      required: 9,
      issuedBy: 'U05',
      issuedAt: ago(2880),
      reason: 'Headway exceeded permit term on 12 of 14 observed trips over five consecutive days.',
      status: 'disputed',
      dispute: {
        at: ago(1400),
        by: 'PO04',
        reason:
          'Road closure at Tamwe Market for festival 14–16 Sep diverted all trips; notified to YRTC by letter 12 Sep.',
        evidence: ['YRTC-letter-12Sep.pdf'],
      },
      ruling: null,
      sanction: null,
    },
    {
      id: 'FND-4402',
      route: 'R07',
      operator: 'PO07',
      dimension: 'fleet_availability',
      measured: 71,
      required: 85,
      issuedBy: 'U05',
      issuedAt: ago(7200),
      reason: 'Only 2 of 3 permitted vehicles in service for 11 days.',
      status: 'upheld',
      dispute: { at: ago(6000), by: 'PO07', reason: 'One vehicle awaiting imported parts.', evidence: [] },
      ruling: {
        at: ago(4000),
        by: 'U06',
        outcome: 'uphold',
        reason: 'Parts delay is an operator commercial risk; permit requires spare ratio 1.42×.',
      },
      sanction: { type: 'fine', amount: 1500000, invoiceId: 'INV-F-9001', status: 'paid' },
    },
    {
      id: 'FND-4403',
      route: 'R06',
      operator: 'PO06',
      dimension: 'coverage',
      measured: 18,
      required: 50,
      issuedBy: 'U05',
      issuedAt: ago(10080),
      reason: 'Coverage below census floor — trackers not transmitting on any vehicle.',
      status: 'upheld',
      dispute: null,
      ruling: { at: ago(8000), by: 'U06', outcome: 'uphold', reason: 'No dispute filed within 14 days.' },
      sanction: { type: 'suspension', amount: 0, invoiceId: null, status: 'active' },
    },
    {
      id: 'FND-4404',
      route: 'R08',
      operator: 'PO08',
      dimension: 'service_standard',
      measured: 81,
      required: 85,
      issuedBy: 'U05',
      issuedAt: ago(720),
      reason: 'Service standard score below threshold for the month of August.',
      status: 'issued',
      dispute: null,
      ruling: null,
      sanction: null,
    },
    {
      id: 'FND-4405',
      route: 'R01',
      operator: 'PO01',
      dimension: 'frequency',
      measured: 8,
      required: 6,
      issuedBy: 'U05',
      issuedAt: ago(1500),
      reason: 'YBS-37 headway exceeded the 8-minute permit term with 6% slack on 9 of 14 observed days.',
      status: 'issued',
      dispute: null,
      ruling: null,
      sanction: null,
    },
    {
      id: 'FND-4406',
      route: 'R09',
      operator: 'PO01',
      dimension: 'fleet_availability',
      measured: 78,
      required: 85,
      issuedBy: 'U05',
      issuedAt: ago(5200),
      reason: 'Two of six permitted vehicles off the road for more than a week without a replacement.',
      status: 'disputed',
      dispute: {
        at: ago(3000),
        by: 'PO01',
        reason: 'Both vehicles were withdrawn on YRTC instruction after the Tamwe collision pending inspection.',
        evidence: ['YRTC-instruction-04Sep.pdf'],
      },
      ruling: null,
      sanction: null,
    },
    {
      id: 'FND-4407',
      route: 'R02',
      operator: 'PO02',
      dimension: 'service_standard',
      measured: 83,
      required: 85,
      issuedBy: 'U05',
      issuedAt: ago(9000),
      reason: 'Cleanliness and information scores below the trunk-line standard in two audits.',
      status: 'upheld',
      dispute: null,
      ruling: { at: ago(7000), by: 'U06', outcome: 'uphold', reason: 'No dispute filed within 14 days.' },
      sanction: { type: 'warning', amount: 0, invoiceId: null, status: 'closed' },
    },
    {
      id: 'FND-4408',
      route: 'R15',
      operator: 'PO09',
      dimension: 'operating_hours',
      measured: 88,
      required: 100,
      issuedBy: 'U05',
      issuedAt: ago(2600),
      reason: 'Last departures ran 40 minutes early against permitted hours on six evenings.',
      status: 'issued',
      dispute: null,
      ruling: null,
      sanction: null,
    },
  ]

  /* ----------------------------------------------------------------- money */
  const days = 14
  const salesDaily = Array.from({ length: days }, (_, k) => {
    const dayIdx = days - 1 - k
    const gross = 7_800_000 + int(rnd, -900_000, 1_600_000) + (dayIdx % 7 === 0 ? 1_800_000 : 0)
    return {
      date: new Date(startOfToday() - dayIdx * D).toISOString().slice(0, 10),
      gross,
      tickets: Math.round(gross / 420),
      platformFee: Math.round(gross * 0.03),
      levy: Math.round(gross * 0.02),
      paymentFee: Math.round(gross * 0.012),
      net: Math.round(gross * 0.938),
    }
  })

  const settlements = operators.map((o, i) => {
    const gross = 620_000 + i * 140_000
    return {
      id: `STL-${new Date().toISOString().slice(0, 10)}-${o.id}`,
      operator: o.id,
      date: new Date(startOfToday() - D).toISOString().slice(0, 10),
      gross,
      platformFee: Math.round(gross * 0.03),
      levy: Math.round(gross * 0.02),
      paymentFee: Math.round(gross * 0.012),
      held: i === 3 ? 180_000 : 0,
      net: Math.round(gross * 0.938) - (i === 3 ? 180_000 : 0),
      status: i === 5 ? 'failed' : i === 3 ? 'held' : 'paid',
      bank: o.bank.name,
      ref: `TRX${900000 + i * 77}`,
    }
  })

  const invoices = [
    ...applications.map((a, i) => ({
      id: a.invoiceId,
      kind: 'licence',
      party: a.operator || 'self-apply',
      partyName: a.applicantName,
      amount: a.fee,
      issuedAt: a.submittedAt,
      status: a.paid ? 'paid' : 'unpaid',
      ref: a.id,
      method: a.paid ? 'Bank VA (KBZ)' : null,
      receiptNo: a.paid ? `RCT-${70000 + i}` : null,
      treasuryPosted: a.paid,
    })),
    {
      id: 'INV-F-9001',
      kind: 'fine',
      party: 'PO07',
      partyName: 'Bagan Star Coach',
      amount: 1500000,
      issuedAt: ago(4000),
      status: 'paid',
      ref: 'FND-4402',
      method: 'Bank transfer',
      receiptNo: 'RCT-70999',
      treasuryPosted: true,
    },
  ]

  const reconciliation = Array.from({ length: 7 }, (_, k) => {
    const date = new Date(startOfToday() - (6 - k) * D).toISOString().slice(0, 10)
    const provider = 7_400_000 + int(rnd, -400_000, 900_000)
    const exc = k === 2 ? 3 : k === 5 ? 1 : 0
    return {
      date,
      provider,
      ledger: provider - exc * 12000,
      bank: provider - exc * 12000,
      exceptions: exc,
      status: exc ? 'exceptions' : 'balanced',
    }
  })

  /* -------------------------------------------------------- ads / cms / ntf */
  const campaigns = [
    {
      id: 'CMP-201',
      advertiser: 'KBZPay',
      slot: 'sponsored_result',
      start: ago(20000),
      end: ahead(40000),
      budget: 4_500_000,
      status: 'live',
      impressions: 412_889,
      clicks: 9_211,
      creative: 'kbzpay-3x1.png',
      targeting: { routes: ['R01', 'R02'], terminals: [], timeBand: 'all' },
      approvedBy: 'U01',
      reason: 'Meets ad policy; financial services permitted.',
    },
    {
      id: 'CMP-202',
      advertiser: 'Yangon City Water',
      slot: 'psa',
      start: ago(9000),
      end: ahead(60000),
      budget: 0,
      status: 'live',
      impressions: 88_120,
      clicks: 1_402,
      creative: 'water-psa.png',
      targeting: { routes: [], terminals: ['T01'], timeBand: 'all' },
      approvedBy: 'U01',
      reason: 'Public service announcement — free, always prioritised.',
    },
    {
      id: 'CMP-203',
      advertiser: 'Shwe Mart',
      slot: 'sponsored_result',
      start: ahead(1440),
      end: ahead(30000),
      budget: 1_200_000,
      status: 'pending',
      impressions: 0,
      clicks: 0,
      creative: 'shwemart-native.png',
      targeting: { routes: ['R03'], terminals: [], timeBand: 'peak' },
      approvedBy: null,
      reason: null,
    },
    {
      id: 'CMP-204',
      advertiser: 'Ruby Tower Casino',
      slot: 'sponsored_result',
      start: ahead(2880),
      end: ahead(40000),
      budget: 3_000_000,
      status: 'rejected',
      impressions: 0,
      clicks: 0,
      creative: 'ruby-banner.png',
      targeting: { routes: [], terminals: [], timeBand: 'all' },
      approvedBy: 'U01',
      reason: 'Gambling is a prohibited category under the advertising policy.',
    },
    {
      id: 'CMP-205',
      advertiser: 'Parami Express Ltd.',
      slot: 'eticket_footer',
      start: ago(4000),
      end: ahead(20000),
      budget: 800_000,
      status: 'live',
      impressions: 51_330,
      clicks: 2_004,
      creative: 'pex-promo.png',
      targeting: { routes: ['R03', 'R10'], terminals: [], timeBand: 'all' },
      approvedBy: 'U01',
      reason: 'Operator promotion within policy.',
    },
    {
      id: 'CMP-206',
      advertiser: 'Yangon Bus Public Co.',
      slot: 'sponsored_result',
      start: ago(6000),
      end: ahead(30000),
      budget: 1_600_000,
      status: 'live',
      impressions: 92_410,
      clicks: 3_880,
      creative: 'ybpc-brt1.png',
      targeting: { routes: ['R01', 'R09'], terminals: [], timeBand: 'peak' },
      approvedBy: 'U01',
      reason: 'Operator service promotion, clearly labelled.',
    },
    {
      id: 'CMP-207',
      advertiser: 'Yangon Bus Public Co.',
      slot: 'terminal_signage',
      start: ahead(1440),
      end: ahead(40000),
      budget: 900_000,
      status: 'pending',
      impressions: 0,
      clicks: 0,
      creative: 'ybpc-signage.mp4',
      targeting: { routes: [], terminals: ['T01'], timeBand: 'all' },
      approvedBy: null,
      reason: null,
    },
    {
      id: 'CMP-208',
      advertiser: 'Shwe Mingalar Transport',
      slot: 'eticket_footer',
      start: ago(12000),
      end: ahead(12000),
      budget: 640_000,
      status: 'live',
      impressions: 38_770,
      clicks: 1_190,
      creative: 'smt-footer.png',
      targeting: { routes: ['R02'], terminals: [], timeBand: 'all' },
      approvedBy: 'U01',
      reason: 'Within the advertising policy.',
    },
    {
      id: 'CMP-209',
      advertiser: 'Mandalay Shwe Pyi Lines',
      slot: 'sponsored_result',
      start: ago(3000),
      end: ahead(26000),
      budget: 720_000,
      status: 'live',
      impressions: 21_560,
      clicks: 702,
      creative: 'msp-native.png',
      targeting: { routes: ['R15', 'R16'], terminals: [], timeBand: 'all' },
      approvedBy: 'U01',
      reason: 'Regional operator promotion.',
    },
  ]

  const announcements = [
    {
      id: 'ANN-01',
      title: 'Thadingyut festival services',
      titleMM: 'သီတင်းကျွတ် ဝန်ဆောင်မှု',
      body: 'Extra late-night departures on YBS-37 and YBS-115 until 01:00 on 5–7 October. Downtown services diverted around Sule Pagoda Road.',
      severity: 'info',
      routes: ['R01', 'R02', 'R03'],
      from: ago(2000),
      to: ahead(20000),
      status: 'published',
      lang: ['en', 'mm'],
    },
    {
      id: 'ANN-02',
      title: 'Tamwe Market road works',
      titleMM: 'တာမွေဈေး လမ်းပြုပြင်',
      body: 'Line 43 and 15 divert via Thitsar Road. Expect 8–12 minutes additional travel time between 09:00 and 16:00.',
      severity: 'warning',
      routes: ['R04', 'R09'],
      from: ago(500),
      to: ahead(8000),
      status: 'published',
      lang: ['en', 'mm'],
    },
    {
      id: 'ANN-03',
      title: 'Hlaing Tharyar bridge closure (night)',
      titleMM: null,
      body: 'Line 61 suspended 23:00–04:00 on 28 September for bridge inspection.',
      severity: 'critical',
      routes: ['R05'],
      from: ahead(4000),
      to: ahead(5000),
      status: 'draft',
      lang: ['en'],
    },
  ]

  const notifications = [
    {
      id: 'NT-1',
      audience: 'citizen',
      title: 'Your ticket is active',
      body: 'Ticket B2R9TL is valid until 23:59 today. Transfers on the same journey are included.',
      at: ago(35),
      read: false,
      deepLink: '/citizen/tickets',
    },
    {
      id: 'NT-2',
      audience: 'citizen',
      title: 'Line 43 diverted',
      body: 'Road works at Tamwe Market. Expect 8–12 min extra travel time.',
      at: ago(500),
      read: false,
      deepLink: '/citizen/alerts',
    },
    {
      id: 'NT-3',
      audience: 'citizen',
      title: 'Trip reminder — Yangon–Bago',
      body: 'Departure tomorrow 10:30 from Aung Mingalar, bay A2. Bus assigned: YGN-2B-7781.',
      at: ago(60),
      read: true,
      deepLink: '/citizen/tickets',
    },
    {
      id: 'NT-4',
      audience: 'driver',
      title: 'Roster published',
      body: 'You have 4 trips assigned on line YBS-37 tomorrow. Acknowledge to confirm.',
      at: ago(180),
      read: false,
      ack: false,
    },
    {
      id: 'NT-5',
      audience: 'driver',
      title: 'Medical certificate expiring',
      body: 'Your medical certificate expires in 21 days. Renew to avoid a check-in block.',
      at: ago(1440),
      read: false,
      ack: false,
    },
    {
      id: 'NT-6',
      audience: 'operator',
      title: 'Finding FND-4404 issued',
      body: 'Service standard below threshold on line 104. Reply within 14 days.',
      at: ago(720),
      read: false,
    },
    {
      id: 'NT-7',
      audience: 'authority',
      title: 'SOS escalation — INC-2602',
      body: 'P1 accident on line 61 unacknowledged for 2 minutes. Escalated to duty officer.',
      at: ago(26),
      read: false,
    },
    {
      id: 'NT-8',
      audience: 'operator',
      title: 'Settlement paid',
      body: 'T+1 payout of 581,560 MMK credited to KBZ 0123-4567-8910.',
      at: ago(300),
      read: true,
    },
  ]

  const helpdesk = [
    {
      id: 'HD-701',
      subject: 'Refund not received',
      category: 'Refund dispute',
      from: 'Citizen',
      at: ago(900),
      status: 'open',
      assignee: 'PO02',
      sla: ahead(1440),
      messages: [
        {
          at: ago(900),
          by: 'Citizen',
          text: 'Trip was cancelled by the operator but refund has not arrived after 5 days.',
        },
      ],
    },
    {
      id: 'HD-702',
      subject: 'Lost phone on YBS-37',
      category: 'Lost & found',
      from: 'Citizen',
      at: ago(2400),
      status: 'resolved',
      assignee: 'PO01',
      sla: ago(900),
      messages: [
        { at: ago(2400), by: 'Citizen', text: 'Left a phone on the 08:12 departure.' },
        { at: ago(1200), by: 'PO01', text: 'Found at Mingalardon depot, collect with ID.' },
      ],
    },
    {
      id: 'HD-703',
      subject: 'Driver refused wheelchair ramp',
      category: 'Accessibility',
      from: 'Citizen',
      at: ago(300),
      status: 'open',
      assignee: 'YRTC',
      sla: ahead(200),
      messages: [{ at: ago(300), by: 'Citizen', text: 'Ramp was not deployed at Hledan Junction.' }],
    },
  ]

  const reviews = [
    {
      id: 'RV-1',
      route: 'R01',
      operator: 'PO01',
      driver: 'D001',
      rating: 5,
      text: 'Clean bus, on time, driver helped with luggage.',
      at: ago(400),
      reply: null,
    },
    {
      id: 'RV-2',
      route: 'R04',
      operator: 'PO04',
      driver: 'D011',
      rating: 2,
      text: 'Waited 25 minutes, bus was very crowded.',
      at: ago(800),
      reply: { at: ago(600), text: 'We apologise — an extra vehicle has been added to the morning peak.' },
    },
    {
      id: 'RV-3',
      route: 'R11',
      operator: 'PO02',
      driver: 'D005',
      rating: 4,
      text: 'Comfortable coach, arrived 15 min late.',
      at: ago(2000),
      reply: null,
    },
    {
      id: 'RV-4',
      route: 'R02',
      operator: 'PO02',
      driver: 'D005',
      rating: 5,
      text: 'Wheelchair ramp worked perfectly.',
      at: ago(120),
      reply: null,
    },
  ]

  const maintenance = [
    {
      id: 'WO-301',
      vehicle: 'V013',
      operator: 'PO05',
      type: 'defect',
      source: 'Driver inspection',
      item: 'Brake warning light',
      severity: 'critical',
      opened: ago(600),
      status: 'open',
      blocksVehicle: true,
      note: 'Reported at pre-trip inspection; vehicle auto-blocked.',
    },
    {
      id: 'WO-302',
      vehicle: 'V006',
      operator: 'PO02',
      type: 'service',
      source: 'Schedule',
      item: '20,000 km service',
      severity: 'routine',
      opened: ago(4000),
      status: 'in_progress',
      blocksVehicle: false,
      note: '',
    },
    {
      id: 'WO-303',
      vehicle: 'V021',
      operator: 'PO07',
      type: 'defect',
      source: 'Driver inspection',
      item: 'Door sensor intermittent',
      severity: 'major',
      opened: ago(9000),
      status: 'closed',
      blocksVehicle: false,
      note: 'Sensor replaced.',
    },
    {
      id: 'WO-304',
      vehicle: 'V001',
      operator: 'PO01',
      type: 'service',
      source: 'Schedule',
      item: '40,000 km service',
      severity: 'routine',
      opened: ago(1800),
      status: 'in_progress',
      blocksVehicle: false,
      note: 'Booked into Mingalardon depot, back in service tomorrow.',
    },
    {
      id: 'WO-305',
      vehicle: 'V002',
      operator: 'PO01',
      type: 'defect',
      source: 'Driver inspection',
      item: 'Air-conditioning weak on lower deck',
      severity: 'major',
      opened: ago(700),
      status: 'open',
      blocksVehicle: false,
      note: 'Reported twice this week; gas top-up scheduled.',
    },
    {
      id: 'WO-306',
      vehicle: 'V005',
      operator: 'PO02',
      type: 'defect',
      source: 'Ramp check',
      item: 'Wheelchair ramp slow to deploy',
      severity: 'major',
      opened: ago(2400),
      status: 'open',
      blocksVehicle: false,
      note: 'Raised at the YRTC ramp check on 20 Sep.',
    },
    {
      id: 'WO-307',
      vehicle: 'V009',
      operator: 'PO03',
      type: 'service',
      source: 'Schedule',
      item: 'Brake pad replacement',
      severity: 'routine',
      opened: ago(5000),
      status: 'closed',
      blocksVehicle: false,
      note: 'Completed and road-tested.',
    },
    {
      id: 'WO-308',
      vehicle: 'V031',
      operator: 'PO08',
      type: 'defect',
      source: 'Driver inspection',
      item: 'Cracked windscreen, passenger side',
      severity: 'critical',
      opened: ago(300),
      status: 'open',
      blocksVehicle: true,
      note: 'Vehicle held at depot until the screen is replaced.',
    },
  ]

  const thresholds = {
    sla: { P1: 5, P2: 15, P3: 240, P4: 4320 },
    serviceStandards: [
      { class: 'Trunk', headwayMin: 10, slackPct: 12, onTimePct: 88 },
      { class: 'Feeder', headwayMin: 15, slackPct: 18, onTimePct: 85 },
      { class: 'Intercity', headwayMin: null, slackPct: null, onTimePct: 90 },
    ],
    spareRatio: 1.42,
    coverageFloors: { full: 80, indicative: 50, warning: 20, censusFloor: 50 },
    kAnonymity: 20,
    version: 3,
    updatedAt: ago(20000),
    updatedBy: 'U01',
    reason: 'Aligned BRT slack with the 2026 service standard circular.',
  }

  // Fare bands (BR-05). The central authority sets a floor and a ceiling per route
  // so operators compete on service rather than by undercutting each other; each
  // operator then prices inside the band from its own portal.
  const fareCaps = routes.map((r) => {
    const cap = r.class === 'Intercity' ? Math.round(r.fare * 1.15) : r.fare + 100
    const floor = r.class === 'Intercity' ? Math.round(r.fare * 0.85) : Math.max(100, r.fare - 100)
    const holders = r.operators || [r.operator]
    return {
      route: r.id,
      floor,
      cap,
      current: r.fare,
      // Each operator prices inside the band on its own.
      prices: Object.fromEntries(
        holders.map((h, hi) => [h, Math.min(cap, r.fare + hi * (r.class === 'Intercity' ? 500 : 50))]),
      ),
      version: 1,
      effectiveFrom: new Date(startOfToday() - 30 * D).toISOString().slice(0, 10),
      setBy: 'U01',
      reason: 'Initial band from the 2026 fare policy circular.',
    }
  })

  const splitRules = [
    { scope: 'Urban — Yangon', poShare: 93.8, platformFee: 3.0, levy: 2.0, paymentFee: 1.2 },
    { scope: 'Intercity — Yangon', poShare: 92.3, platformFee: 4.0, levy: 2.5, paymentFee: 1.2 },
  ]

  const feeSchedule = licenceTypes.map((t) => ({
    code: t.code,
    label: t.label,
    amount: t.fee,
    effectiveFrom: '2026-01-01',
    version: 2,
    reason: 'Annual indexation approved by the Ministry.',
    approvedBy: 'U01',
  }))

  const integrations = [
    { id: 'INT-01', name: 'National ID / eKYC', status: 'up', latencyMs: 380, lastCheck: ago(2), mode: 'live' },
    { id: 'INT-02', name: 'Driving licence', status: 'degraded', latencyMs: 2400, lastCheck: ago(3), mode: 'live' },
    { id: 'INT-03', name: 'Vehicle registry', status: 'up', latencyMs: 510, lastCheck: ago(2), mode: 'live' },
    { id: 'INT-04', name: 'Company & tax registry', status: 'up', latencyMs: 640, lastCheck: ago(4), mode: 'live' },
    { id: 'INT-05', name: 'Payment providers', status: 'up', latencyMs: 290, lastCheck: ago(1), mode: 'live' },
    { id: 'INT-06', name: 'Treasury', status: 'up', latencyMs: 810, lastCheck: ago(6), mode: 'live' },
    { id: 'INT-07', name: 'SMS / OTP', status: 'up', latencyMs: 190, lastCheck: ago(1), mode: 'live' },
    { id: 'INT-08', name: 'Push & messaging', status: 'up', latencyMs: 120, lastCheck: ago(1), mode: 'live' },
    { id: 'INT-09', name: 'Telematics', status: 'up', latencyMs: 95, lastCheck: ago(1), mode: 'live' },
    { id: 'INT-10', name: 'Maps & geocoding', status: 'up', latencyMs: 60, lastCheck: ago(1), mode: 'live' },
    { id: 'INT-11', name: 'Emergency dispatch', status: 'sandbox', latencyMs: 0, lastCheck: ago(30), mode: 'sandbox' },
    { id: 'INT-12', name: 'Insurance', status: 'down', latencyMs: 0, lastCheck: ago(45), mode: 'live' },
    {
      id: 'INT-13',
      name: 'Enforcement / e-fine',
      status: 'sandbox',
      latencyMs: 0,
      lastCheck: ago(60),
      mode: 'sandbox',
    },
    { id: 'INT-14', name: 'Open data (GTFS-RT)', status: 'up', latencyMs: 140, lastCheck: ago(2), mode: 'live' },
    { id: 'INT-15', name: 'AI / LLM gateway', status: 'up', latencyMs: 720, lastCheck: ago(2), mode: 'live' },
  ]

  const audit = [
    {
      id: 'AU-9001',
      at: ago(20),
      actor: 'U07',
      role: 'safety',
      action: 'Acknowledged incident',
      object: 'INC-2601',
      reason: null,
      category: 'Incidents',
    },
    {
      id: 'AU-9002',
      at: ago(120),
      actor: 'U05',
      role: 'compliance',
      action: 'Issued finding',
      object: 'FND-4404',
      reason: 'Service standard below threshold for August.',
      category: 'Compliance',
    },
    {
      id: 'AU-9003',
      at: ago(300),
      actor: 'U04',
      role: 'lic_approver',
      action: 'Approved application',
      object: 'APP-2026-1007',
      reason: 'All checks passed.',
      category: 'Administration',
    },
    {
      id: 'AU-9004',
      at: ago(900),
      actor: 'U08',
      role: 'planning',
      action: 'Exported per-line figures',
      object: 'R04 · Sep 2026',
      reason: null,
      category: 'Exports',
      flag: 'none recorded — one was required',
    },
    {
      id: 'AU-9005',
      at: ago(1400),
      actor: 'U06',
      role: 'adjudicator',
      action: 'Ruled on dispute',
      object: 'FND-4402',
      reason: 'Parts delay is an operator commercial risk.',
      category: 'Compliance',
    },
    {
      id: 'AU-9006',
      at: ago(20000),
      actor: 'U01',
      role: 'nat_policy',
      action: 'Changed threshold',
      object: 'BRT slack 6%',
      reason: 'Aligned with 2026 service standard circular.',
      category: 'Administration',
    },
    {
      id: 'AU-9007',
      at: ago(240),
      actor: 'PO01',
      role: 'po_ops',
      action: 'Published roster',
      object: 'YBS-37 · 14 trips',
      reason: null,
      category: 'Administration',
    },
    {
      id: 'AU-9008',
      at: ago(640),
      actor: 'PO01',
      role: 'po_admin',
      action: 'Changed selling fare',
      object: 'YBS-37 · 400 MMK',
      reason: 'Held at the band floor for the festival period.',
      category: 'Administration',
    },
    {
      id: 'AU-9009',
      at: ago(1100),
      actor: 'PO01',
      role: 'po_ops',
      action: 'Responded to forwarded incident',
      object: 'INC-2601',
      reason: 'Driver interviewed and vehicle inspected on return to depot.',
      category: 'Incidents',
    },
    {
      id: 'AU-9010',
      at: ago(2600),
      actor: 'PO01',
      role: 'po_admin',
      action: 'Exported per-line figures',
      object: 'YBS-37 · Sep 2026',
      reason: 'Monthly board pack for the operations committee.',
      category: 'Exports',
    },
    {
      id: 'AU-9011',
      at: ago(4300),
      actor: 'PO02',
      role: 'po_finance',
      action: 'Downloaded settlement statement',
      object: 'STL-2026-09-PO02',
      reason: null,
      category: 'Administration',
    },
    {
      id: 'AU-9012',
      at: ago(8000),
      actor: 'PO03',
      role: 'po_admin',
      action: 'Submitted licence application',
      object: 'APP-2026-1001',
      reason: null,
      category: 'Administration',
    },
  ]

  const bays = {}
  terminals.forEach((t) => {
    bays[t.id] = {}
  })
  departures
    .filter((d) => new Date(d.depart) < Date.now() + 2 * D)
    .forEach((d, i) => {
      const t = terminals.find((x) => x.id === (d.boardingPoints[0] || 'T01')) || terminals[0]
      d.bay = t.bays[i % t.bays.length]
    })

  // Passengers already booked on the next terminal departures, so the gate,
  // the manifest and the boarding console all have something real to work with.
  const gateCheckins = []
  const names = [
    'Ma Thida Win',
    'U Hla Tun',
    'Daw Moe Moe',
    'Ko Zin Ko',
    'Ma Nwe Nwe',
    'U Sai Aung',
    'Daw Khin Thet',
    'Ko Pyae Sone',
  ]
  departures
    .filter((d) => new Date(d.depart) > Date.now() && new Date(d.depart) < Date.now() + 2 * D)
    .slice(0, 6)
    .forEach((d, di) => {
      const route = routes.find((r) => r.id === d.route)
      const seats = d.soldSeats.slice(0, 3 + (di % 2))
      seats.forEach((seat, si) => {
        const who = names[(di * 3 + si) % names.length]
        const code = `${String.fromCharCode(65 + di)}${String.fromCharCode(70 + si)}${2000 + di * 17 + si}`
        const checked = di === 0 && si < 2
        tickets.push({
          id: `TK-${5000 + di * 10 + si}`,
          kind: 'scheduled',
          route: d.route,
          operator: d.operator,
          fare: d.fare,
          qty: 1,
          passenger: who,
          phone: `+95 9 79${100000 + di * 977 + si}`,
          passengers: [
            { name: who, seat, phone: `+95 9 79${100000 + di * 977 + si}`, ticketNo: `${code}-1`, qr: `YG1.${code}` },
          ],
          purchasedAt: ago(600 + di * 120),
          departureId: d.id,
          departAt: d.depart,
          arriveAt: d.arrive,
          validUntil: d.arrive,
          seats: [seat],
          seatsReserved: route?.class === 'Intercity',
          boardingPoint: d.boardingPoints[0],
          droppingPoint: d.droppingPoints[0],
          status: checked ? 'checked_in' : 'booked',
          checkedInAt: checked ? ago(30) : undefined,
          pnr: code,
          vehicle: d.vehicle,
          method: di % 2 ? 'kbzpay' : 'wave',
          qr: `YG1.${code}`,
        })
        if (checked) {
          gateCheckins.push({
            id: `GC-${5000 + di * 10 + si}`,
            terminal: d.boardingPoints[0],
            departure: d.id,
            ticket: `TK-${5000 + di * 10 + si}`,
            at: ago(30),
          })
        }
      })
    })

  return {
    version: SCHEMA_VERSION,
    seededAt: new Date().toISOString(),
    operators,
    vehicles,
    drivers,
    users,
    poUsers,
    roles,
    permits,
    applications,
    trips,
    departures,
    tickets,
    incidents,
    compliance,
    findings,
    salesDaily,
    settlements,
    invoices,
    reconciliation,
    campaigns,
    announcements,
    notifications,
    helpdesk,
    reviews,
    maintenance,
    thresholds,
    fareCaps,
    splitRules,
    feeSchedule,
    integrations,
    audit,
    gateCheckins,
    wallet: {
      balance: 12_400,
      history: [
        { id: 'W1', at: ago(140), type: 'payment', amount: -400, note: 'Ticket TK-1001 · YBS-37' },
        { id: 'W2', at: ago(2880), type: 'topup', amount: 20_000, note: 'Top-up via KBZPay' },
        { id: 'W3', at: ago(2880), type: 'payment', amount: -4_500, note: 'Ticket TK-1003 · Yangon–Bago' },
        { id: 'W4', at: ago(35), type: 'payment', amount: -600, note: 'Ticket TK-1002 · Line 36 ×2' },
      ],
    },
    citizenReports: [
      {
        id: 'RP-501',
        category: 'Dangerous overcrowding',
        route: 'R02',
        at: ago(4000),
        status: 'verified',
        ref: 'REF-8803',
        anonymous: true,
      },
      {
        id: 'RP-502',
        category: 'Vehicle condition',
        route: 'R08',
        at: ago(300),
        status: 'acknowledged',
        ref: 'REF-8804',
        anonymous: false,
      },
    ],
    savedPlaces: [
      { id: 'SP1', label: 'Home', name: 'Thingangyun', stop: 'S08' },
      { id: 'SP2', label: 'Work', name: 'Sule Pagoda', stop: 'S01' },
      { id: 'SP3', label: 'School', name: 'Dagon University', stop: 'S11' },
    ],
    failedSearches: [
      { from: 'Shwepyithar', to: 'Hledan Junction', count: 412, reason: 'no route' },
      { from: 'Dala', to: 'Sule Pagoda', count: 388, reason: 'no route (ferry only)' },
      { from: 'North Dagon', to: 'Insein', count: 291, reason: 'transfers > 2' },
      { from: 'Thanlyin', to: 'Botahtaung', count: 255, reason: 'no route' },
      { from: 'Hmawbi', to: 'Mingalardon', count: 188, reason: 'no service at hour' },
    ],
    session: {},
  }
}

/* ------------------------------------------------------------- persistence */
export function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.version === SCHEMA_VERSION) return parsed
    }
  } catch {
    /* corrupted storage — reseed */
  }
  const fresh = buildSeed()
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(fresh))
  } catch {
    /* quota */
  }
  return fresh
}

export function saveDb(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    /* quota */
  }
}

export function resetDb() {
  try {
    localStorage.removeItem(DB_KEY)
  } catch {
    /* noop */
  }
  return buildSeed()
}
