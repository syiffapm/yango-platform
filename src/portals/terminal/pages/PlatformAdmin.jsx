import { useState } from 'react'
import { Database, FlaskConical, Plug, RotateCcw, Server, Upload, Bot } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import { Toggle } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { relative, num } from '../../../lib/format.js'
import { routes, stops, terminals } from '../../../data/geo.js'
const TENANTS = [
  { id: 'MM', name: 'Myanmar — national', level: 'Country', children: 5, status: 'active' },
  { id: 'YGN', name: 'Yangon Region (pilot)', level: 'Region', children: 1, status: 'active' },
  { id: 'MDY', name: 'Mandalay Region', level: 'Region', children: 1, status: 'active' },
  { id: 'BAG', name: 'Bago Region', level: 'Region', children: 0, status: 'active' },
  { id: 'SHN', name: 'Shan State', level: 'Region', children: 0, status: 'active' },
  { id: 'AYE', name: 'Ayeyarwady Region', level: 'Region', children: 0, status: 'pending' },
]
export default function PlatformAdmin() {
  const { db, reset } = useDb()
  const toast = useToast()
  const [tab, setTab] = useState('tenants')
  const [flags, setFlags] = useState({
    scheduled_booking: true,
    chatbot: true,
    ads: true,
    enforcement: false,
    open_data: true,
    ai_forecast: false,
    offline_qr: true,
    terminal_signage: false,
  })
  const master = [
    {
      entity: 'Routes (GTFS)',
      count: routes.length,
      owner: 'Authority',
      updated: relative(new Date(Date.now() - 86400000).toISOString()),
    },
    {
      entity: 'Stops',
      count: stops.length,
      owner: 'Authority',
      updated: relative(new Date(Date.now() - 172800000).toISOString()),
    },
    {
      entity: 'Terminals',
      count: terminals.length,
      owner: 'Terminal authority',
      updated: relative(new Date(Date.now() - 604800000).toISOString()),
    },
    {
      entity: 'Operators',
      count: (db.operators || []).length,
      owner: 'Licensing',
      updated: relative(new Date(Date.now() - 3600000).toISOString()),
    },
    {
      entity: 'Vehicles',
      count: db.vehicles.length,
      owner: 'Operator / licensing',
      updated: relative(new Date(Date.now() - 7200000).toISOString()),
    },
    {
      entity: 'Drivers',
      count: db.drivers.length,
      owner: 'Driver / operator / licensing',
      updated: relative(new Date(Date.now() - 1800000).toISOString()),
    },
    {
      entity: 'Permits',
      count: db.permits.length,
      owner: 'Licensing',
      updated: relative(new Date(Date.now() - 900000).toISOString()),
    },
  ]
  const services = [
    ['API gateway', 'up', 42],
    ['IAM / SSO', 'up', 88],
    ['Licensing workflow', 'up', 120],
    ['Booking & order', 'up', 96],
    ['Payment orchestration', 'up', 210],
    ['Telematics ingest', 'up', 31],
    ['Real-time & ETA', 'up', 54],
    ['Safety & incident', 'up', 63],
    ['Notification', 'up', 77],
    ['Analytics & reporting', 'degraded', 1840],
    ['AI / ML & chatbot', 'up', 640],
  ]
  return (
    <>
      <PageHeader
        title="Platform admin"
        subtitle="Tenants, master data, integration configuration, feature flags, system health and the chatbot knowledge base. The platform super-admin holds no business permission."
        actions={
          <Button
            icon={RotateCcw}
            onClick={() => {
              reset()
              toast({ title: 'Demo data reseeded', body: 'Every portal is back to the shipped baseline.' })
            }}
          >
            Reseed demo data
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { value: 'tenants', label: 'Tenants', count: TENANTS.length },
          { value: 'master', label: 'Master data' },
          { value: 'flags', label: 'Feature flags' },
          { value: 'health', label: 'System health' },
          { value: 'bot', label: 'Chatbot KB' },
        ]}
      />

      {tab === 'tenants' && (
        <DataTable
          search={false}
          columns={[
            { key: 'id', header: 'Code' },
            { key: 'name', header: 'Tenant' },
            { key: 'level', header: 'Level', render: (r) => <Badge tone="brand">{r.level}</Badge> },
            { key: 'children', header: 'Sub-tenants', align: 'right' },
            { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
          ]}
          rows={TENANTS}
          exportName="tenants"
        />
      )}

      {tab === 'master' && (
        <>
          <Card className="mb-4">
            <CardHeader
              title="Master data"
              icon={Database}
              subtitle="Filed once by its owner and reused by every channel — nothing is re-keyed."
              action={
                <Button
                  size="sm"
                  icon={Upload}
                  onClick={() =>
                    toast({
                      title: 'GTFS import queued',
                      body: 'Routes, stops, shapes and calendars are validated before they replace the current feed.',
                    })
                  }
                >
                  Import GTFS
                </Button>
              }
            />
            <CardBody className="p-0">
              <DataTable
                search={false}
                columns={[
                  { key: 'entity', header: 'Entity' },
                  { key: 'count', header: 'Records', align: 'right', render: (r) => num(r.count) },
                  { key: 'owner', header: 'Owned by' },
                  { key: 'updated', header: 'Last changed' },
                ]}
                rows={master.map((m) => ({ ...m, id: m.entity }))}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="Open data"
              icon={Plug}
              subtitle="GTFS and GTFS-RT published for map platforms and resellers"
            />
            <CardBody className="flex flex-wrap gap-2">
              <Badge tone="green">GTFS static — published daily</Badge>
              <Badge tone="green">GTFS-RT vehicle positions — 10 s</Badge>
              <Badge tone="green">GTFS-RT trip updates — 30 s</Badge>
              <Badge tone="slate">Service alerts feed — on publish</Badge>
            </CardBody>
          </Card>
        </>
      )}

      {tab === 'flags' && (
        <Card>
          <CardHeader
            title="Feature flags"
            icon={FlaskConical}
            subtitle="Phase 2 and 3 capabilities can be switched on per tenant without a release."
          />
          <CardBody className="grid sm:grid-cols-2 gap-x-8">
            {Object.entries(flags).map(([k, v]) => (
              <Toggle
                key={k}
                label={k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
                hint={
                  {
                    scheduled_booking: 'Seat map, boarding points, refunds — phase 2',
                    chatbot: 'Ask YanGo citizen and officer assistants',
                    ads: 'Advertising engine and banner slots',
                    enforcement: 'e-Fines and police e-ticketing link',
                    open_data: 'Public GTFS / GTFS-RT feed',
                    ai_forecast: 'Demand forecast overlay in planning',
                    offline_qr: 'Offline signed-QR validation on the driver app',
                    terminal_signage: 'Digital signage slots at terminals',
                  }[k]
                }
                checked={v}
                onChange={(val) => {
                  setFlags((f) => ({ ...f, [k]: val }))
                  toast({ title: `${k.replace(/_/g, ' ')} ${val ? 'enabled' : 'disabled'}` })
                }}
              />
            ))}
          </CardBody>
        </Card>
      )}

      {tab === 'health' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Backend services"
              icon={Server}
              subtitle="34 microservices in eight domains behind one API gateway"
            />
            <CardBody className="space-y-2 max-h-[420px] overflow-y-auto scroll-thin">
              {services.map(([name, status, ms]) => (
                <div key={name} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                  <span className={`w-2 h-2 rounded-full ${status === 'up' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="flex-1 text-[12.5px] text-ink-800">{name}</span>
                  <span className={`text-[12px] tabular-nums ${ms > 1000 ? 'text-amber-700' : 'text-ink-500'}`}>
                    {ms} ms
                  </span>
                  <StatusPill status={status} />
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Service levels" subtitle="Against the non-functional requirements" />
            <CardBody className="space-y-3">
              {[
                ['Citizen app availability', 99.94, 99.9],
                ['SOS & ticket validation', 99.97, 99.95],
                ['QR validation under 300 ms', 98.2, 95],
                ['Search results under 2 s', 96.8, 95],
                ['Coverage Index', 84, 85],
              ].map(([label, actual, target]) => (
                <div key={label}>
                  <div className="flex justify-between text-[12.5px] mb-1">
                    <span className="text-ink-600">{label}</span>
                    <span className={actual >= target ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                      {actual}% (target {target}%)
                    </span>
                  </div>
                  <Progress value={actual} tone={actual >= target ? 'green' : 'amber'} />
                </div>
              ))}
              <div className="pt-2 border-t border-ink-100 flex flex-wrap gap-1.5">
                <Badge tone="slate">RPO 15 min</Badge>
                <Badge tone="slate">RTO 2 h</Badge>
                <Badge tone="slate">In-country hosting</Badge>
                <Badge tone="slate">DR drill twice a year</Badge>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'bot' && (
        <Card>
          <CardHeader
            title="Chatbot knowledge base"
            icon={Bot}
            subtitle="Three assistants on one LLM gateway with retrieval over approved content and read-only tool calls"
          />
          <CardBody className="space-y-3">
            {[
              [
                'Citizen assistant — “Ask YanGo”',
                'Passengers',
                'Trip planning, next bus, fares, terminal facilities, own ticket status, refund policy, lost & found, complaints, SOS',
              ],
              [
                'Operator assistant',
                'PO staff',
                'Explain permit rules, check timetable against headway, summarise incidents, draft dispute text, explain settlement, find expiring licences',
              ],
              [
                'Officer assistant',
                'Officers',
                'Summarise network status, draft the weekly brief, explain a figure, pre-screen application completeness, search regulations',
              ],
            ].map(([name, users, caps]) => (
              <div key={name} className="rounded-lg border border-ink-200 p-3.5">
                <div className="flex items-center gap-2">
                  <p className="text-[12.5px] font-medium text-ink-900">{name}</p>
                  <Badge tone="brand">{users}</Badge>
                </div>
                <p className="text-[12.5px] text-ink-500 mt-1 leading-relaxed">{caps}</p>
              </div>
            ))}
            <div className="rounded-lg bg-violet-50 border border-violet-200 p-3.5">
              <p className="text-[12.5px] text-violet-900 leading-relaxed">
                Models are hosted in-country. Any transaction — booking, refund or SOS — is handed back to the normal UI
                for the user to confirm; the assistant never completes one on its own.
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  )
}
