import { useMemo, useState } from 'react'
import { CheckCircle2, ScanLine, WifiOff, XCircle, Coins } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import { Select } from '../../../components/ui/Field.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { nextDepartures, findDeparture } from '../../../lib/schedule.js'
import { routes } from '../../../data/geo.js'
import { timeOnly, dt } from '../../../lib/format.js'
export default function Boarding() {
  const { db, update, op, routes: myRoutes } = useOperator()
  const toast = useToast()
  const [log, setLog] = useState([])
  const [offline, setOffline] = useState(false)
  const [scanning, setScanning] = useState(false)

  // Departures this operator is running next, across its own lines.
  const upcoming = myRoutes
    .flatMap((r) => nextDepartures(r.id, db, 4))
    .sort((a, b) => new Date(a.depart) - new Date(b.depart))
    .slice(0, 20)
  const [depId, setDepId] = useState(upcoming[0]?.id)
  const dep = findDeparture(depId, db) || upcoming[0]
  const route = routes.find((r) => r.id === dep?.route)

  // Passengers who already boarded this run are part of its log, whether the
  // scan happened on this device or at the terminal gate.
  const alreadyBoarded = useMemo(
    () =>
      (db.tickets || [])
        .filter((t) => t.departureId === dep?.id && t.checkedInAt)
        .map((t) => ({
          id: `seed-${t.id}`,
          ok: true,
          at: t.checkedInAt,
          pnr: t.pnr,
          text: `${t.passenger} · seat ${(t.seats || []).join(', ')} — boarded`,
        })),
    [db.tickets, dep?.id],
  )
  const entries = [...log, ...alreadyBoarded].sort((a, b) => new Date(b.at) - new Date(a.at))
  const vehicle = db.vehicles.find((v) => v.id === dep?.vehicle)
  const candidates = db.tickets.filter((t) => t.operator === op.id && ['active', 'booked'].includes(t.status))

  // Everyone booked on this run, whichever channel sold the seat.
  const expected = (() => {
    if (!dep) return []
    const booked = db.tickets.filter((x) => x.departureId === dep.id)
    const covered = new Set(booked.flatMap((t) => t.seats || []))
    const counter = (dep.soldSeats || [])
      .filter((seat) => !covered.has(seat))
      .map((seat, i) => ({
        id: `${dep.id}-${seat}`,
        seats: [seat],
        passenger: `Counter sale ${i + 1}`,
        pnr: `CS${String(seat).padStart(2, '0')}${dep.id.slice(-3)}`,
        qty: 1,
        checkedInAt: undefined,
      }))
    return [...booked, ...counter].sort((a, b) => (a.seats?.[0] ?? 0) - (b.seats?.[0] ?? 0))
  })()

  const scan = () => {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      const ticket = candidates.find((c) => !log.some((e) => e.pnr === c.pnr)) || candidates[0]
      if (!ticket) {
        setLog((l) => [
          { id: Date.now(), ok: false, text: 'No valid ticket found', at: new Date().toISOString() },
          ...l,
        ])
        toast({ title: 'Invalid QR', body: 'No matching ticket in the offline key set.', kind: 'error' })
        return
      }
      const already = log.some((e) => e.pnr === ticket.pnr)
      if (already) {
        setLog((l) => [
          {
            id: Date.now(),
            ok: false,
            pnr: ticket.pnr,
            text: `Duplicate use — ${ticket.pnr} already scanned`,
            at: new Date().toISOString(),
          },
          ...l,
        ])
        toast({ title: 'Duplicate ticket', body: 'This QR has already been used on this trip.', kind: 'error' })
        return
      }
      update((d) => {
        const t = d.tickets.find((x) => x.id === ticket.id)
        if (t.kind === 'urban') t.status = 'used'
        t.checkedInAt = new Date().toISOString()
        t.vehicle = vehicle?.id
      })
      setLog((l) => [
        {
          id: Date.now(),
          ok: true,
          pnr: ticket.pnr,
          text: `${ticket.passenger}${
            ticket.seats
              ? ` · seat ${ticket.seats.join(', ')}`
              : ` · ${ticket.qty}
passenger(s)`
          }`,
          at: new Date().toISOString(),
          queued: offline,
        },
        ...l,
      ])
      toast({
        title: 'Boarding confirmed',
        body: offline
          ? 'Verified offline against the signed QR — will sync when you have signal.'
          : `${ticket.pnr} checked in.`,
      })
    }, 650)
  }
  const cash = () => {
    setLog((l) => [
      { id: Date.now(), ok: true, text: 'Walk-in cash passenger recorded', at: new Date().toISOString(), cash: true },
      ...l,
    ])
    toast({ title: 'Cash passenger recorded', body: 'Counted towards boardings and reconciled with the operator.' })
  }
  const boarded = entries.filter((e) => e.ok && !e.cash).length
  return (
    <>
      <PageHeader
        title="Boarding & check-in"
        subtitle="Scan the passenger QR at the door or the gate. Conductors and station staff use this screen; the driver only sees the passenger list."
        meta={
          <Badge tone={offline ? 'amber' : 'green'} dot>
            {offline ? 'Offline mode' : 'Online'}
          </Badge>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Boarded this session"
          value={boarded}
          icon={CheckCircle2}
          method="Passengers whose QR has been accepted at this door."
        />
        <Stat label="Expected on this run" value={expected.length} method="Seats sold on the selected departure." />
        <Stat
          label="Cash passengers"
          value={log.filter((e) => e.cash).length}
          icon={Coins}
          method="Walk-on cash fares recorded where the route still allows them."
        />
        <Stat
          label="Rejected scans"
          value={log.filter((e) => !e.ok).length}
          tone={log.some((e) => !e.ok) ? 'warn' : 'good'}
          method="Wrong departure, already used, or an unreadable code."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Scanner" subtitle={vehicle ? `${vehicle.plate} · ${route?.line}` : 'Select a departure'} />
          <CardBody>
            <Select value={depId || ''} onChange={(e) => setDepId(e.target.value)} className="mb-3">
              {upcoming.map((d) => (
                <option key={d.id} value={d.id}>
                  {routes.find((r) => r.id === d.route)?.line} · {dt(d.depart)}
                </option>
              ))}
            </Select>

            <div className="rounded-2xl border-2 border-dashed border-ink-300 bg-ink-50 aspect-square grid place-items-center relative overflow-hidden">
              {scanning && (
                <div
                  className="absolute inset-x-0 h-0.5 bg-brand-500 animate-[yg-scan_1.2s_ease-in-out_infinite]"
                  style={{ top: '50%' }}
                />
              )}
              <div className="text-center">
                <ScanLine
                  size={52}
                  className={scanning ? 'text-brand-600 mx-auto animate-pulse' : 'text-ink-400 mx-auto'}
                />
                <p className="text-[12.5px] text-ink-600 mt-3">
                  {scanning ? 'Reading QR…' : 'Point the camera at the passenger QR'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button variant="primary" size="lg" icon={ScanLine} onClick={scan} disabled={scanning}>
                Scan ticket
              </Button>
              <Button size="lg" icon={Coins} onClick={cash}>
                Cash passenger
              </Button>
            </div>

            <button
              onClick={() => setOffline((o) => !o)}
              className="mt-3 w-full flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3.5 py-3 text-left"
            >
              <WifiOff size={16} className={offline ? 'text-amber-600' : 'text-ink-400'} />
              <span className="flex-1">
                <span className="block text-[12.5px] font-medium text-ink-900">Offline verification</span>
                <span className="block text-[12px] text-ink-500">
                  Signed QR is checked against cached keys; events sync later
                </span>
              </span>
              <Badge tone={offline ? 'amber' : 'slate'}>{offline ? 'On' : 'Off'}</Badge>
            </button>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Scan log" subtitle={dep ? `${route?.name} · ${dt(dep.depart)}` : ''} />
          <CardBody>
            {entries.length > 0 ? (
              <>
                <div className="space-y-2">
                  {entries.map((e) => (
                    <div
                      key={e.id}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${e.ok ? 'border-emerald-200 bg-emerald-50/60' : 'border-red-200 bg-red-50'}`}
                    >
                      {e.ok ? (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle size={16} className="text-red-600 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-ink-900 truncate">{e.text}</p>
                        <p className="text-[11.5px] text-ink-400">
                          {timeOnly(e.at)} {e.pnr ? `· ${e.pnr}` : ''}
                        </p>
                      </div>
                      {e.queued && <Badge tone="amber">Queued</Badge>}
                      {e.cash && <Badge tone="slate">Cash</Badge>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[12.5px] text-ink-400 py-8 text-center">
                Nobody has boarded this run yet. Scans appear here as passengers come through the door.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Expected passengers"
            subtitle="Name, seat and ticket number only — nothing else about the passenger reaches this screen."
          />
          <CardBody className="p-0">
            <DataTable
              search={false}
              columns={[
                { key: 'seats', header: 'Seat', render: (r) => r.seats?.join(', ') || '—' },
                { key: 'passenger', header: 'Passenger' },
                { key: 'pnr', header: 'Ticket code', render: (r) => <span className="font-mono">{r.pnr}</span> },
                { key: 'qty', header: 'Tickets', align: 'right' },
                {
                  key: 'checkedInAt',
                  header: 'Boarded',
                  render: (r) =>
                    r.checkedInAt ? (
                      <Badge tone="green">{timeOnly(r.checkedInAt)}</Badge>
                    ) : (
                      <Badge tone="amber">Not yet</Badge>
                    ),
                },
              ]}
              rows={expected}
              empty="No booked passengers on this departure"
            />
          </CardBody>
        </Card>
      </div>
    </>
  )
}
