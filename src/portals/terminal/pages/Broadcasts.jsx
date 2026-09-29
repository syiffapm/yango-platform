import { useState } from 'react'
import { Megaphone, Send, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import { Checkbox, Field, Select, Textarea, Input } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { num, relative } from '../../../lib/format.js'
import { routes, terminals } from '../../../data/geo.js'
const SEGMENTS = [
  { value: 'all', label: 'All app users', size: 184_000 },
  { value: 'route', label: 'Passengers on a route', size: 21_400 },
  { value: 'terminal', label: 'Passengers at a terminal', size: 6_800 },
  { value: 'pass', label: 'Pass holders', size: 12_100 },
  { value: 'drivers', label: 'Drivers on duty', size: 36 },
]
export default function Broadcasts() {
  const { db, notify } = useDb()
  const toast = useToast()
  const [form, setForm] = useState({
    segment: 'route',
    route: 'R01',
    title: '',
    body: '',
    safety: false,
    approved: false,
  })
  const [sent, setSent] = useState([
    {
      id: 'BC-01',
      title: 'Thadingyut extra services',
      segment: 'All app users',
      size: 184000,
      at: new Date(Date.now() - 86400000).toISOString(),
      delivered: 176_412,
      opened: 61_204,
      by: 'Daw Khin Myat',
    },
    {
      id: 'BC-02',
      title: 'Tamwe Market diversion',
      segment: 'Passengers on line 43',
      size: 21400,
      at: new Date(Date.now() - 3 * 3600000).toISOString(),
      delivered: 20_118,
      opened: 9_442,
      by: 'Daw Aye Thida',
    },
  ])
  const segment = SEGMENTS.find((s) => s.value === form.segment)
  const needsApproval = segment.size > 50_000
  const send = () => {
    const id = `BC-${String(10 + sent.length)}`
    setSent((s) => [
      {
        id,
        title: form.title,
        segment: segment.label,
        size: segment.size,
        at: new Date().toISOString(),
        delivered: Math.round(segment.size * 0.96),
        opened: Math.round(segment.size * 0.33),
        by: 'Terminal manager',
      },
      ...s,
    ])
    notify({ audience: form.segment === 'drivers' ? 'driver' : 'citizen', title: form.title, body: form.body })
    toast({ title: 'Broadcast sent', body: `Queued to ${num(segment.size)} recipients with push-to-SMS fallback.` })
    setForm((f) => ({ ...f, title: '', body: '', approved: false }))
  }
  return (
    <>
      <PageHeader
        title="Broadcasts"
        subtitle="Segmented broadcasts by route, area, terminal, pass holders or role. Mass broadcasts above 50,000 recipients need a second approval."
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Sent this week"
          value={sent.length}
          icon={Megaphone}
          method="Broadcasts dispatched from this console."
        />
        <Stat
          label="Delivered"
          value={num(sent.reduce((s, b) => s + b.delivered, 0))}
          tone="good"
          method="Messages the provider confirmed as delivered, after push-to-SMS fallback."
        />
        <Stat
          label="Open rate"
          value={`${Math.round(
            (sent.reduce((s, b) => s + b.opened, 0) /
              Math.max(
                1,
                sent.reduce((s, b) => s + b.delivered, 0),
              )) *
              100,
          )}%`}
          method="Opened ÷ delivered across recent broadcasts."
        />
        <Stat
          label="Reachable audience"
          value={num(184_000)}
          method="App users with notifications enabled, excluding marketing opt-outs."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Compose" icon={Send} />
          <CardBody className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Segment">
                <Select value={form.segment} onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}>
                  {SEGMENTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label} — {num(s.size)}
                    </option>
                  ))}
                </Select>
              </Field>
              {form.segment === 'route' && (
                <Field label="Line">
                  <Select value={form.route} onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))}>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.line} · {r.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {form.segment === 'terminal' && (
                <Field label="Terminal">
                  <Select>
                    {terminals.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>

            <Field label="Title" required>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </Field>
            <Field label="Message" required hint="Keep under 160 characters so the SMS fallback is not split.">
              <Textarea rows={3} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
            </Field>

            <Checkbox
              checked={form.safety}
              onChange={(e) => setForm((f) => ({ ...f, safety: e.target.checked }))}
              label="Send as a safety message"
              hint="Bypasses quiet hours, marketing opt-out and channel preferences. Use only for genuine safety content."
            />

            {needsApproval && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-[12.5px] text-amber-900 leading-relaxed mb-2 inline-flex items-start gap-2">
                  <ShieldCheck size={14} className="mt-px shrink-0" />
                  This segment is above 50,000 recipients, so a second approver must sign the broadcast off before it is
                  queued.
                </p>
                <Checkbox
                  checked={form.approved}
                  onChange={(e) => setForm((f) => ({ ...f, approved: e.target.checked }))}
                  label="Second approval obtained"
                />
              </div>
            )}

            <Button
              variant="primary"
              icon={Send}
              disabled={!form.title || !form.body || (needsApproval && !form.approved)}
              onClick={send}
            >
              Send to {num(segment.size)} recipients
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Preview" subtitle="Push notification" />
          <CardBody>
            <div className="rounded-xl border border-ink-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded bg-brand-600 text-white grid place-items-center text-[10.5px] font-bold">
                  YG
                </span>
                <span className="text-[11.5px] text-ink-400">YanGo · now</span>
                {form.safety && <Badge tone="red">Safety</Badge>}
              </div>
              <p className="text-[12.5px] font-semibold text-ink-900">{form.title || 'Notification title'}</p>
              <p className="text-[12.5px] text-ink-600 mt-0.5 leading-relaxed">
                {form.body || 'Your message will appear here.'}
              </p>
            </div>
            <p className="text-[11.5px] text-ink-400 mt-3 leading-relaxed">
              Delivery falls back from push to SMS after 60 seconds without a receipt. Rate limiting protects the SMS
              gateway during mass sends.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Recent broadcasts" />
        <CardBody className="p-0">
          <DataTable
            search={false}
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'title', header: 'Title' },
              { key: 'segment', header: 'Segment' },
              { key: 'size', header: 'Audience', align: 'right', render: (r) => num(r.size) },
              { key: 'delivered', header: 'Delivered', align: 'right', render: (r) => num(r.delivered) },
              { key: 'opened', header: 'Opened', align: 'right', render: (r) => num(r.opened) },
              { key: 'by', header: 'Sent by' },
              { key: 'at', header: 'When', render: (r) => relative(r.at) },
            ]}
            rows={sent}
            exportName="broadcasts"
          />
        </CardBody>
      </Card>
    </>
  )
}
