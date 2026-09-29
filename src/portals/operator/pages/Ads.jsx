import { useState } from 'react'
import { Megaphone, Plus } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import { Field, Input, Select, Textarea } from '../../../components/ui/Field.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dateOnly, num, pct } from '../../../lib/format.js'
const SLOTS = [
  { value: 'sponsored_result', label: 'Sponsored result — journey results (labelled)' },
  { value: 'eticket_footer', label: 'E-ticket footer — ticket screen and PDF' },
  { value: 'confirmation_offer', label: 'Confirmation offer — after payment' },
  { value: 'in_bus', label: 'In-bus screen — your own buses' },
]
export default function Ads() {
  const { db, update, notify, op, routes: myRoutes } = useOperator()
  const toast = useToast()
  const [creating, setCreating] = useState(null)
  const mine = db.campaigns.filter((c) => c.advertiser === op.name)
  const book = () => {
    const id = `CMP-${300 + db.campaigns.length}`
    update((d) => {
      d.campaigns.unshift({
        id,
        advertiser: op.name,
        slot: creating.slot,
        start: new Date(creating.start || Date.now()).toISOString(),
        end: new Date(creating.end || Date.now() + 30 * 86400000).toISOString(),
        budget: Number(creating.budget || 500000),
        status: 'pending',
        impressions: 0,
        clicks: 0,
        creative: creating.creative || 'creative.png',
        targeting: {
          routes: creating.routes ? [creating.routes] : [],
          terminals: [],
          timeBand: creating.timeBand || 'all',
        },
        approvedBy: null,
        reason: null,
      })
    })
    notify({
      audience: 'authority',
      title: 'Campaign awaiting approval',
      body: `${op.name} booked ${creating.slot}. Creative needs authority approval.`,
    })
    toast({
      title: 'Campaign booked',
      body: 'The creative goes to the authority approval queue before it can be delivered.',
    })
    setCreating(null)
  }
  return (
    <>
      <PageHeader
        title="Ads & promotions"
        subtitle="Book slots, upload creatives and target by route, terminal and time. Every creative is checked against the advertising policy and approved by the authority before delivery."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setCreating({ slot: 'sponsored_result', budget: 500000 })}
          >
            Book a campaign
          </Button>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat label="Campaigns" value={mine.length} icon={Megaphone} method="Campaigns booked by your company." />
        <Stat
          label="Impressions"
          value={num(mine.reduce((s, c) => s + c.impressions, 0))}
          method="Aggregate delivery counts. No personal profiling is used for targeting."
        />
        <Stat
          label="Click-through"
          value={pct(
            (mine.reduce((s, c) => s + c.clicks, 0) /
              Math.max(
                1,
                mine.reduce((s, c) => s + c.impressions, 0),
              )) *
              100,
            2,
          )}
          method="Clicks ÷ impressions across live campaigns."
        />
        <Stat
          label="Spend"
          value={MMK(mine.filter((c) => c.status === 'live').reduce((s, c) => s + c.budget, 0))}
          method="Budget committed on live campaigns."
        />
      </StatGrid>

      <DataTable
        columns={[
          { key: 'id', header: 'Campaign' },
          { key: 'slot', header: 'Slot', render: (r) => r.slot.replace(/_/g, ' ') },
          { key: 'start', header: 'Runs', render: (r) => `${dateOnly(r.start)} – ${dateOnly(r.end)}` },
          { key: 'budget', header: 'Budget', align: 'right', render: (r) => MMK(r.budget) },
          { key: 'impressions', header: 'Impressions', align: 'right', render: (r) => num(r.impressions) },
          { key: 'clicks', header: 'Clicks', align: 'right', render: (r) => num(r.clicks) },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
        ]}
        rows={mine}
        exportName="campaigns"
        empty="No campaigns booked yet"
      />

      <Card className="mt-4">
        <CardHeader
          title="Advertising policy"
          subtitle="In a government app, ads must be approved, clearly labelled and never targeted using passenger identity."
        />
        <CardBody>
          <div className="flex flex-wrap gap-1.5">
            {['Alcohol', 'Tobacco', 'Gambling', 'Political'].map((p) => (
              <Badge key={p} tone="red">
                Prohibited: {p}
              </Badge>
            ))}
            <Badge tone="green">Public service announcements always override commercial slots</Badge>
          </div>
        </CardBody>
      </Card>

      <Modal
        open={!!creating}
        onClose={() => setCreating(null)}
        title="Book a campaign"
        subtitle="Contextual targeting only — route, terminal, time band, language and service class."
        footer={
          <>
            <Button onClick={() => setCreating(null)}>Cancel</Button>
            <Button variant="primary" onClick={book}>
              Submit for approval
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Slot" required>
            <Select value={creating?.slot} onChange={(e) => setCreating((s) => ({ ...s, slot: e.target.value }))}>
              {SLOTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <Input type="date" onChange={(e) => setCreating((s) => ({ ...s, start: e.target.value }))} />
            </Field>
            <Field label="End">
              <Input type="date" onChange={(e) => setCreating((s) => ({ ...s, end: e.target.value }))} />
            </Field>
          </div>
          <Field label="Budget (MMK)">
            <Input
              type="number"
              value={creating?.budget || ''}
              onChange={(e) => setCreating((s) => ({ ...s, budget: e.target.value }))}
            />
          </Field>
          <Field label="Target line" hint="Contextual targeting only — never passenger identity">
            <Select onChange={(e) => setCreating((s) => ({ ...s, routes: e.target.value }))}>
              <option value="">All lines</option>
              {myRoutes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.line} · {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Creative" hint="Image 3:1 for banners; automated size and content checks run on upload">
            <Textarea
              rows={2}
              placeholder="creative-file-name.png"
              onChange={(e) => setCreating((s) => ({ ...s, creative: e.target.value }))}
            />
          </Field>
        </div>
      </Modal>
    </>
  )
}
