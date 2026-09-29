import { useMemo, useState } from 'react'
import { CheckCircle2, ScanLine, XCircle, LogIn, LogOut } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import { Select } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { routes, terminals } from '../../../data/geo.js'
import { timeOnly, dt } from '../../../lib/format.js'
export default function GateCheckIn() {
  const { db, update } = useDb()
  const [ses] = useSession('terminal')
  const toast = useToast()
  const t = terminals.find((x) => x.id === ses.terminalId) || terminals[0]
  const [scanning, setScanning] = useState(false)
  const [log, setLog] = useState([])
  const deps = db.departures
    .filter((d) => d.boardingPoints.includes(t.id) && new Date(d.depart) > Date.now())
    .sort((a, b) => new Date(a.depart) - new Date(b.depart))
  const [depId, setDepId] = useState(deps[0]?.id)
  const dep = deps.find((d) => d.id === depId) || deps[0]
  const tickets = db.tickets.filter((x) => x.departureId === dep?.id && x.status === 'booked')

  // Scans already recorded at this gate belong in the log, not just the ones
  // made since this screen was opened.
  const recorded = useMemo(
    () =>
      (db.gateCheckins || [])
        .filter((g) => g.terminal === t.id)
        .map((g) => {
          const tk = db.tickets.find((x) => x.id === g.ticket)
          return {
            id: g.id,
            ok: true,
            at: g.at,
            pnr: tk?.pnr,
            text: tk ? `${tk.passenger} · seat ${(tk.seats || []).join(', ')} — through the gate` : 'Passenger boarded',
          }
        }),
    [db.gateCheckins, db.tickets, t.id],
  )
  const entries = [...log, ...recorded].sort((a, b) => new Date(b.at) - new Date(a.at))

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
      const ticket = tickets.find((x) => !log.some((l) => l.pnr === x.pnr))
      if (!ticket) {
        setLog((l) => [
          { id: Date.now(), ok: false, text: 'No matching ticket for this departure', at: new Date().toISOString() },
          ...l,
        ])
        toast({ title: 'Invalid at this gate', body: 'The QR is valid but not for this departure.', kind: 'error' })
        return
      }
      update((d) => {
        const x = d.tickets.find((y) => y.id === ticket.id)
        x.checkedInAt = new Date().toISOString()
        d.gateCheckins.unshift({
          id: `GC-${Date.now()}`,
          terminal: t.id,
          departure: dep.id,
          ticket: ticket.id,
          at: new Date().toISOString(),
        })
      })
      setLog((l) => [
        {
          id: Date.now(),
          ok: true,
          pnr: ticket.pnr,
          text: `${ticket.passenger} · seat ${ticket.seats?.join(', ')}`,
          at: new Date().toISOString(),
        },
        ...l,
      ])
      toast({ title: 'Checked in at gate', body: `${ticket.pnr} boarded through ${t.name}.` })
    }, 600)
  }
  const gateEvent = (kind) => {
    setLog((l) => [
      {
        id: Date.now(),
        ok: true,
        text: `Bus ${kind === 'in' ? 'gate-in' : 'gate-out'} recorded${dep ? ` · ${routes.find((r) => r.id === dep.route)?.line}` : ''}`,
        at: new Date().toISOString(),
        vehicle: true,
      },
      ...l,
    ])
    toast({ title: `Gate-${kind} logged`, body: 'Plate recognition is optional; the event is recorded either way.' })
  }
  return (
    <>
      <PageHeader
        title="Gate check-in"
        subtitle="Scan passenger QR at the gate and log bus gate-in and gate-out. Check-ins feed the crowd monitor and the operator's manifest."
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Checked in today"
          value={db.gateCheckins.length + log.filter((l) => l.ok && !l.vehicle).length}
          icon={ScanLine}
          method="Passengers who passed through a gate at this terminal today."
        />
        <Stat
          label="Expected on next departure"
          value={expected.length}
          method="Seats sold on the departure selected below."
        />
        <Stat
          label="Gate events"
          value={log.filter((l) => l.vehicle).length}
          method="Bus gate-in and gate-out records; plate recognition optional."
        />
        <Stat
          label="Rejected scans"
          value={log.filter((l) => !l.ok).length}
          tone={log.some((l) => !l.ok) ? 'warn' : 'good'}
          method="QRs that are valid but not for the selected departure, or already used."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Scanner" subtitle="Point the gate reader at the passenger QR" />
          <CardBody>
            <Select value={depId} onChange={(e) => setDepId(e.target.value)} className="mb-3">
              {deps.slice(0, 12).map((d) => (
                <option key={d.id} value={d.id}>
                  {timeOnly(d.depart)} · {routes.find((r) => r.id === d.route)?.line} · bay {d.bay || 'TBA'}
                </option>
              ))}
            </Select>

            <div className="rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 aspect-square grid place-items-center">
              <div className="text-center">
                <ScanLine
                  size={44}
                  className={scanning ? 'text-brand-600 mx-auto animate-pulse' : 'text-ink-400 mx-auto'}
                />
                <p className="text-[12px] text-ink-500 mt-2">{scanning ? 'Reading…' : 'Ready'}</p>
              </div>
            </div>

            <Button variant="primary" full className="mt-3" icon={ScanLine} onClick={scan} disabled={scanning || !dep}>
              Scan ticket
            </Button>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button icon={LogIn} onClick={() => gateEvent('in')}>
                Bus gate-in
              </Button>
              <Button icon={LogOut} onClick={() => gateEvent('out')}>
                Bus gate-out
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Gate log"
            subtitle={
              dep ? `${routes.find((r) => r.id === dep.route)?.name} · ${dt(dep.depart)} · bay ${dep.bay || 'TBA'}` : ''
            }
          />
          <CardBody className="p-0">
            <div className="divide-y divide-ink-50 max-h-[420px] overflow-y-auto scroll-thin">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  {e.ok ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-red-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] text-ink-900 truncate">{e.text}</p>
                    <p className="text-[11.5px] text-ink-400">
                      {timeOnly(e.at)} {e.pnr ? `· ${e.pnr}` : ''}
                    </p>
                  </div>
                  {e.vehicle && <Badge tone="slate">Vehicle</Badge>}
                </div>
              ))}
              {entries.length === 0 && (
                <p className="px-4 py-10 text-center text-[12.5px] text-ink-400">
                  No passenger has come through the gate yet on this shift.
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Expected passengers"
            subtitle="Name, seat and ticket ID only — no other passenger data reaches the gate"
          />
          <CardBody className="p-0">
            <DataTable
              search={false}
              columns={[
                { key: 'seats', header: 'Seat', render: (r) => r.seats?.join(', ') || '—' },
                { key: 'passenger', header: 'Passenger' },
                { key: 'pnr', header: 'PNR', render: (r) => <span className="font-mono">{r.pnr}</span> },
                { key: 'id', header: 'Ticket' },
                {
                  key: 'checkedInAt',
                  header: 'Check-in',
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
