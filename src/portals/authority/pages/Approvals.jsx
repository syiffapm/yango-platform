import { useState } from 'react'
import { useTx } from '../../../lib/adminLang.js'
import { Ban, Check, Megaphone, Sparkles, FileText } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import useAuthority from '../useAuthority.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dateOnly, num, pct } from '../../../lib/format.js'
const PROHIBITED = ['Alcohol', 'Tobacco', 'Gambling', 'Political']
export default function Approvals() {
  const tx = useTx()
  const { db, update, audit, notify, me, can } = useAuthority()
  const toast = useToast()
  const [tab, setTab] = useState('ads')
  const [acting, setActing] = useState(null)
  const pending = db.campaigns.filter((c) => c.status === 'pending')
  const draftContent = db.announcements.filter((a) => a.status === 'draft')
  const decide = (reason) => {
    const { item, outcome, kind } = acting
    update((d) => {
      if (kind === 'ad') {
        const c = d.campaigns.find((x) => x.id === item.id)
        c.status = outcome === 'approve' ? 'live' : 'rejected'
        c.approvedBy = me.id
        c.reason = reason
      } else {
        const a = d.announcements.find((x) => x.id === item.id)
        a.status = outcome === 'approve' ? 'published' : 'rejected'
        a.approvedBy = me.id
        a.reason = reason
      }
    })
    audit({
      actor: me.id,
      role: me.role,
      action: `${outcome === 'approve' ? 'Approved' : 'Rejected'} ${kind === 'ad' ? 'campaign' : 'content'}`,
      object: item.id,
      reason,
      category: 'Administration',
    })
    if (kind === 'ad')
      notify({
        audience: 'operator',
        title: `Campaign ${outcome === 'approve' ? 'approved' : 'rejected'} — ${item.id}`,
        body: reason,
      })
    toast({ title: outcome === 'approve' ? 'Approved' : 'Rejected' })
    setActing(null)
  }
  return (
    <>
      <PageHeader
        title="Ads & content approval"
        subtitle="FR-AUT-85 / in a government app every creative is approved, clearly labelled and never targeted using passenger identity. Public service announcements always override commercial slots."
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Awaiting approval"
          value={pending.length + draftContent.length}
          tone={pending.length + draftContent.length ? 'warn' : 'good'}
          icon={Megaphone}
          method="Campaigns and content items that cannot be delivered until an officer approves them."
        />
        <Stat
          label="Live campaigns"
          value={db.campaigns.filter((c) => c.status === 'live').length}
          tone="good"
          method="Approved and currently delivering."
        />
        <Stat
          label="Impressions"
          value={num(db.campaigns.reduce((s, c) => s + c.impressions, 0))}
          method="Aggregate delivery counts. No personal profiling is used for targeting."
        />
        <Stat
          label="Ad revenue booked"
          value={MMK(db.campaigns.filter((c) => c.status === 'live').reduce((s, c) => s + c.budget, 0))}
          method="Budget committed on live campaigns. Revenue is split between authority, platform and operator."
        />
      </StatGrid>

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { value: 'ads', label: 'Ad campaigns', count: db.campaigns.length },
          { value: 'content', label: 'Content & alerts', count: db.announcements.length },
          { value: 'policy', label: 'Advertising policy' },
        ]}
      />

      {tab === 'ads' && (
        <div className="space-y-3">
          {db.campaigns.map((c) => (
            <Card key={c.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-ink-900">{c.advertiser}</span>
                      <StatusPill status={c.status} />
                      <Badge tone="slate">{c.slot.replace(/_/g, ' ')}</Badge>
                      {c.slot === 'psa' && <Badge tone="green">PSA — always prioritised, free</Badge>}
                    </div>
                    <p className="text-[12.5px] text-ink-500 mt-1">
                      {c.id} · {dateOnly(c.start)} – {dateOnly(c.end)} · budget {MMK(c.budget)} · creative {c.creative}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {c.targeting.routes.length > 0 && (
                        <Badge tone="brand">Routes: {c.targeting.routes.join(', ')}</Badge>
                      )}
                      {c.targeting.terminals.length > 0 && (
                        <Badge tone="brand">Terminals: {c.targeting.terminals.join(', ')}</Badge>
                      )}
                      <Badge tone="slate">Time band: {c.targeting.timeBand}</Badge>
                      <Badge tone="slate">Contextual targeting only</Badge>
                    </div>
                  </div>

                  {c.status === 'pending' &&
                    (can.approveAds ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          icon={Ban}
                          onClick={() => setActing({ item: c, outcome: 'reject', kind: 'ad' })}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          icon={Check}
                          onClick={() => setActing({ item: c, outcome: 'approve', kind: 'ad' })}
                        >
                          Approve
                        </Button>
                      </div>
                    ) : (
                      <Badge tone="amber">National policy officer approves creatives</Badge>
                    ))}
                </div>

                <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3 flex items-start gap-2.5">
                  <Sparkles size={14} className="text-violet-600 mt-px shrink-0" />
                  <p className="text-[12.5px] text-violet-900 leading-relaxed">
                    AI creative check: size and format valid.{' '}
                    {PROHIBITED.some(
                      (p) =>
                        c.advertiser.toLowerCase().includes(p.toLowerCase()) ||
                        c.advertiser.toLowerCase().includes('casino'),
                    )
                      ? 'Flagged — appears to fall in a prohibited category (gambling).'
                      : 'No prohibited category detected. Advisory only — an officer decides.'}
                  </p>
                </div>

                {c.status !== 'pending' && c.reason && (
                  <div className="mt-2 rounded-lg bg-ink-50 border border-ink-100 p-3">
                    <p className="text-[11.5px] uppercase tracking-wider text-ink-400 mb-1">Decision reason</p>
                    <p className="text-[12.5px] text-ink-800">“{c.reason}”</p>
                  </div>
                )}

                {c.impressions > 0 && (
                  <div className="mt-3 pt-3 border-t border-ink-100 flex flex-wrap gap-4">
                    {[
                      ['Impressions', num(c.impressions)],
                      ['Clicks', num(c.clicks)],
                      ['CTR', pct((c.clicks / Math.max(1, c.impressions)) * 100, 2)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[11px] uppercase tracking-wider text-ink-400">{tx(k)}</p>
                        <p className="text-[13px] font-medium text-ink-900">{v}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {tab === 'content' && (
        <div className="space-y-3">
          {db.announcements.map((a) => (
            <Card key={a.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink-900">{a.title}</span>
                      <StatusPill status={a.status} />
                      <Badge tone={a.severity === 'critical' ? 'red' : a.severity === 'warning' ? 'amber' : 'blue'}>
                        {a.severity}
                      </Badge>
                    </div>
                    {a.titleMM && <p className="text-[12.5px] text-ink-500">{a.titleMM}</p>}
                    <p className="text-[12px] text-ink-600 mt-1.5 leading-relaxed max-w-2xl">{a.body}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {a.routes.map((r) => (
                        <Badge key={r} tone="slate">
                          {r}
                        </Badge>
                      ))}
                      {a.lang.map((l) => (
                        <Badge key={l} tone="brand">
                          {l.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {a.status === 'draft' &&
                    (can.approveAds ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          icon={Ban}
                          onClick={() => setActing({ item: a, outcome: 'reject', kind: 'content' })}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          icon={Check}
                          onClick={() => setActing({ item: a, outcome: 'approve', kind: 'content' })}
                        >
                          Publish
                        </Button>
                      </div>
                    ) : (
                      <Badge tone="amber">Approval required before publish</Badge>
                    ))}
                </div>
              </CardBody>
            </Card>
          ))}
          {db.announcements.length === 0 && <Empty icon={FileText} title="No content items" />}
        </div>
      )}

      {tab === 'policy' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Prohibited categories"
              subtitle="Creatives in these categories are refused regardless of budget"
            />
            <CardBody className="flex flex-wrap gap-2">
              {PROHIBITED.map((p) => (
                <Badge key={p} tone="red">
                  {p}
                </Badge>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Rules that always apply" />
            <CardBody>
              <ul className="space-y-2 text-[12px] text-ink-600">
                {[
                  'Every ad is labelled — sponsored results say “Sponsored”.',
                  'Targeting is contextual only: route, terminal, area, time, language, service class.',
                  'Passenger identity is never used for targeting and never sold.',
                  'Delivery reporting is aggregate; there is no personal profiling.',
                  'Public service announcements override commercial slots and are free.',
                  'Push offers reach opted-in users only; safety messages bypass every preference.',
                ].map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      )}

      <ReasonDialog
        open={!!acting}
        onClose={() => setActing(null)}
        onConfirm={decide}
        title={acting?.outcome === 'approve' ? 'Approve' : 'Reject'}
        confirmLabel={acting?.outcome === 'approve' ? 'Approve' : 'Reject'}
        variant={acting?.outcome === 'approve' ? 'primary' : 'danger'}
        subtitle={
          acting
            ? `${acting.item.advertiser || acting.item.title} — the reason is sent to the advertiser and stored in the audit log.`
            : ''
        }
      />
    </>
  )
}
