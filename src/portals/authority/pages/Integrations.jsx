import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { useTx } from '../../../lib/adminLang.js'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import useAuthority from '../useAuthority.js'
import { relative } from '../../../lib/format.js'
import { Plug } from 'lucide-react'
const COUNTERPARTIES = {
  'INT-01': 'National ID registry; eKYC vendor',
  'INT-02': 'Road transport administration licence database',
  'INT-03': 'Vehicle registration and roadworthiness records',
  'INT-04': 'Company registry (DICA MyCO), tax authority',
  'INT-05': 'KBZPay, Wave Money, AYA Pay, CB Pay, MPU, Visa/Mastercard, banks',
  'INT-06': 'Government revenue account',
  'INT-07': "Mobile operators' SMS gateways",
  'INT-08': 'FCM, APNs, Viber Business, WhatsApp Business, SMTP',
  'INT-09': 'GPS trackers, MDVR dashcams, APC sensors (GT06/JT808)',
  'INT-10': 'OpenStreetMap tiles, self-hosted geocoder and routing',
  'INT-11': 'Police, ambulance, fire, traffic control',
  'INT-12': 'Insurers',
  'INT-13': 'Traffic police e-ticketing, roadside inspection devices',
  'INT-14': 'GTFS / GTFS-RT public feed, map platforms, ticket resellers',
  'INT-15': 'In-country LLM, Myanmar speech-to-text',
}
export default function Integrations() {
  const tx = useTx()
  const { db } = useAuthority()
  const rows = db.integrations.map((i) => ({ ...i, counterparty: COUNTERPARTIES[i.id] || '—' }))
  const down = rows.filter((r) => r.status === 'down')
  const degraded = rows.filter((r) => r.status === 'degraded')
  return (
    <>
      <PageHeader
        title="Integration monitor"
        subtitle="Health of every external engine. Each integration sits behind an adapter with retries, a circuit breaker, PII-masked logging, a sandbox mode and a documented manual fallback."
        meta={
          <Badge tone={down.length ? 'red' : degraded.length ? 'amber' : 'green'} dot>
            {down.length ? `${down.length} down` : degraded.length ? `${degraded.length} degraded` : 'All operational'}
          </Badge>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat label="Integrations" value={rows.length} icon={Plug} method="External engines the platform depends on." />
        <Stat
          label="Operational"
          value={rows.filter((r) => r.status === 'up').length}
          tone="good"
          method="Responding within the expected latency envelope."
        />
        <Stat
          label="Degraded or down"
          value={down.length + degraded.length}
          tone={down.length ? 'bad' : degraded.length ? 'warn' : 'good'}
          method="Slow or unavailable. The documented manual fallback applies while an engine is down."
        />
        <Stat
          label="In sandbox"
          value={rows.filter((r) => r.mode === 'sandbox').length}
          tone="muted"
          method="Connected to a test endpoint pending a signed data-sharing agreement."
        />
      </StatGrid>

      <DataTable
        search={false}
        columns={[
          { key: 'id', header: 'ID', width: 80 },
          { key: 'name', header: 'Engine' },
          { key: 'counterparty', header: 'Counterparty (to be confirmed)', className: 'max-w-md' },
          {
            key: 'latencyMs',
            header: 'Latency',
            align: 'right',
            render: (r) =>
              r.latencyMs ? (
                <span className={r.latencyMs > 1500 ? 'text-amber-700 font-medium' : ''}>{r.latencyMs} ms</span>
              ) : (
                '—'
              ),
          },
          { key: 'lastCheck', header: 'Last check', render: (r) => relative(r.lastCheck) },
          {
            key: 'mode',
            header: 'Mode',
            render: (r) => <Badge tone={r.mode === 'sandbox' ? 'violet' : 'slate'}>{r.mode}</Badge>,
          },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
        ]}
        rows={rows}
        exportName="integration-monitor"
        pageSize={16}
      />

      <Card className="mt-4">
        <CardHeader
          title="Manual fallbacks in force"
          subtitle="So the pilot can start before every agency is connected"
        />
        <CardBody className="space-y-2">
          {[
            [
              'Driving licence registry (degraded)',
              'Officers verify against the uploaded licence scan and record the check on the verification checklist.',
            ],
            [
              'Insurance (down)',
              'Policy certificates are verified manually from the document vault; claims are handled outside the platform.',
            ],
            [
              'Emergency dispatch (sandbox)',
              'The duty officer telephones the control room; the call is logged against the incident.',
            ],
            [
              'Enforcement / e-fine (sandbox)',
              'e-Fines are issued in the platform and re-keyed into the police system by the enforcement desk.',
            ],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-ink-200 p-3">
              <p className="text-[12.5px] font-medium text-ink-900">{tx(k)}</p>
              <p className="text-[12.5px] text-ink-500 mt-0.5 leading-relaxed">{v}</p>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  )
}
