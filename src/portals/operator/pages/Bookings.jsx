import { useState } from 'react'
import { Printer, ScanLine, Ticket, UserPlus } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { Field, Input, Select } from '../../../components/ui/Field.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dt, timeOnly } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
import { pnr as makePnr } from '../../../lib/id.js'
export default function Bookings() {
  const { db, update, departures, op } = useOperator()
  const toast = useToast()
  const [tab, setTab] = useState('bookings')
  const [counter, setCounter] = useState(null)
  const myTickets = db.tickets.filter((t) => t.operator === op.id)
  const upcoming = departures.filter((d) => new Date(d.depart) > Date.now()).slice(0, 20)
  const sell = () => {
    const dep = departures.find((d) => d.id === counter.departureId)
    const seat = (dep.soldSeats.length || 0) + 1
    const id = `TK-${9000 + db.tickets.length}`
    update((d) => {
      const x = d.departures.find((y) => y.id === counter.departureId)
      x.soldSeats.push(seat)
      d.tickets.unshift({
        id,
        kind: 'scheduled',
        route: dep.route,
        operator: op.id,
        fare: dep.fare,
        qty: 1,
        passenger: counter.name,
        phone: counter.phone,
        purchasedAt: new Date().toISOString(),
        departureId: dep.id,
        seats: [seat],
        boardingPoint: dep.boardingPoints[0],
        droppingPoint: dep.droppingPoints[0],
        status: 'booked',
        pnr: makePnr(),
        vehicle: null,
        channel: 'counter',
      })
    })
    toast({
      title: 'Counter sale complete',
      body: `${counter.name} — seat ${seat}, ${MMK(dep.fare)}. E-ticket sent by SMS.`,
    })
    setCounter(null)
  }
  const manifestRows = upcoming.slice(0, 1).flatMap((d) =>
    d.soldSeats.slice(0, 12).map((s, i) => ({
      id: `${d.id}-${s}`,
      seat: s,
      name: i === 0 ? 'Demo Citizen' : `Passenger ${String.fromCharCode(65 + i)}`,
      ticket: `TK-${8000 + i}`,
      checkedIn: i % 3 !== 0,
      point: d.boardingPoints[0],
    })),
  )
  return (
    <>
      <PageHeader
        title="Bookings & manifest"
        subtitle="Search bookings, the passenger manifest per trip, check-in status, no-shows, reissue and counter sale. Drivers see name, seat and ticket ID only."
        actions={
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => setCounter({ departureId: upcoming[0]?.id, name: '', phone: '' })}
          >
            Counter sale
          </Button>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Bookings"
          value={myTickets.length}
          icon={Ticket}
          method="Tickets sold on your services through every channel."
        />
        <Stat
          label="Checked in"
          value={myTickets.filter((t) => t.status === 'used').length}
          method="Passengers whose QR has been scanned by a driver or a gate."
        />
        <Stat label="Upcoming departures" value={upcoming.length} method="Scheduled departures still open for sale." />
        <Stat
          label="Revenue (booked)"
          value={MMK(myTickets.reduce((s, t) => s + t.fare * t.qty, 0))}
          method="Gross value of tickets sold; settlement is net of fees and levy."
        />
      </StatGrid>

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { value: 'bookings', label: 'Bookings', count: myTickets.length },
          { value: 'manifest', label: 'Passenger manifest' },
        ]}
      />

      {tab === 'bookings' &&
        (myTickets.length ? (
          <DataTable
            columns={[
              { key: 'pnr', header: 'PNR', render: (r) => <span className="font-mono font-medium">{r.pnr}</span> },
              { key: 'id', header: 'Ticket' },
              { key: 'route', header: 'Line', render: (r) => routes.find((x) => x.id === r.route)?.line },
              {
                key: 'kind',
                header: 'Type',
                render: (r) => <Badge tone={r.kind === 'urban' ? 'brand' : 'blue'}>{r.kind}</Badge>,
              },
              { key: 'passenger', header: 'Passenger' },
              { key: 'seats', header: 'Seat', render: (r) => (r.seats ? r.seats.join(', ') : '—') },
              { key: 'fare', header: 'Fare', align: 'right', render: (r) => MMK(r.fare * r.qty) },
              { key: 'purchasedAt', header: 'Purchased', render: (r) => dt(r.purchasedAt) },
              { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
            ]}
            rows={myTickets}
            exportName="bookings"
            searchKeys={['pnr', 'id', 'passenger', 'phone']}
          />
        ) : (
          <Empty
            title="No bookings on your services yet"
            hint="Sell a ticket from the Citizen App or use Counter sale."
          />
        ))}

      {tab === 'manifest' && (
        <Card>
          <CardHeader
            title={
              upcoming[0]
                ? `${routes.find((r) => r.id === upcoming[0].route)?.line} · ${timeOnly(upcoming[0].depart)}`
                : 'Manifest'
            }
            subtitle="The same list the driver sees in the app — name, seat and ticket ID only. No other passenger data is exposed."
            action={
              <>
                <Button size="xs" icon={ScanLine}>
                  Gate check-in
                </Button>
                <Button size="xs" icon={Printer}>
                  Print
                </Button>
              </>
            }
          />
          <CardBody className="p-0">
            <DataTable
              search={false}
              dense
              columns={[
                { key: 'seat', header: 'Seat', width: 70 },
                { key: 'name', header: 'Passenger' },
                { key: 'ticket', header: 'Ticket ID' },
                { key: 'point', header: 'Boarding point' },
                {
                  key: 'checkedIn',
                  header: 'Check-in',
                  render: (r) =>
                    r.checkedIn ? <Badge tone="green">Checked in</Badge> : <Badge tone="amber">Not yet</Badge>,
                },
              ]}
              rows={manifestRows}
              empty="No passengers on this departure"
            />
          </CardBody>
        </Card>
      )}

      <Modal
        open={!!counter}
        onClose={() => setCounter(null)}
        title="Counter sale"
        subtitle="Sell a seat at the terminal counter. The passenger receives the same signed QR as an app booking."
        footer={
          <>
            <Button onClick={() => setCounter(null)}>Cancel</Button>
            <Button variant="primary" disabled={!counter?.name} onClick={sell}>
              Sell ticket
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Departure" required>
            <Select
              value={counter?.departureId || ''}
              onChange={(e) => setCounter((s) => ({ ...s, departureId: e.target.value }))}
            >
              {upcoming.map((d) => (
                <option key={d.id} value={d.id}>
                  {routes.find((r) => r.id === d.route)?.line} · {dt(d.depart)} · {d.capacity - d.soldSeats.length}{' '}
                  seats left
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Passenger name" required>
            <Input value={counter?.name || ''} onChange={(e) => setCounter((s) => ({ ...s, name: e.target.value }))} />
          </Field>
          <Field label="Mobile number" hint="The e-ticket is sent by SMS as well as in the app">
            <Input
              value={counter?.phone || ''}
              onChange={(e) => setCounter((s) => ({ ...s, phone: e.target.value }))}
            />
          </Field>
        </div>
      </Modal>
    </>
  )
}
