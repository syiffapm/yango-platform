import { useState } from 'react'
import { useTx } from '../../../lib/adminLang.js'
import { Link } from 'react-router-dom'
import { Bot, ExternalLink, Sparkles, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Progress from '../../../components/ui/Progress.jsx'
import { Toggle } from '../../../components/ui/Field.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { aiUseCases, assistants, guardrails, aiKpis } from '../../../data/ai.js'
export default function AiInsights() {
  const tx = useTx()
  const toast = useToast()
  const [tab, setTab] = useState('models')
  const [enabled, setEnabled] = useState(Object.fromEntries(aiUseCases.map((u) => [u.id, u.status !== 'planned'])))
  const live = aiUseCases.filter((u) => u.status === 'live').length
  const pilot = aiUseCases.filter((u) => u.status === 'pilot').length
  return (
    <>
      <PageHeader
        title="AI & automation"
        subtitle="Every model on the platform, what it reads, what it produces and where its output appears. All outputs are advisory: a named officer still makes each regulatory decision."
        meta={
          <>
            <Badge tone="violet" icon={Sparkles}>
              Models hosted in-country
            </Badge>
            <Badge tone="slate">Monitored for accuracy and bias</Badge>
          </>
        }
        actions={
          <Button icon={ExternalLink} as={Link} to="/blueprint">
            Full solution blueprint
          </Button>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Models live"
          value={live}
          tone="good"
          icon={Sparkles}
          method="In production and feeding a screen today."
        />
        <Stat
          label="In pilot"
          value={pilot}
          tone="warn"
          method="Running against real data but labelled as indicative until accepted."
        />
        <Stat
          label="Planned"
          value={aiUseCases.length - live - pilot}
          method="Phase 3 capabilities behind a feature flag."
        />
        <Stat
          label="Chatbot containment"
          value="63%"
          tone="good"
          method="Conversations resolved without a human agent. Phase 2 exit criterion is 60%."
        />
      </StatGrid>

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { value: 'models', label: 'Models', count: aiUseCases.length },
          { value: 'assistants', label: 'Assistants', count: assistants.length },
          { value: 'guardrails', label: 'Guardrails' },
          { value: 'kpis', label: 'Quality KPIs' },
        ]}
      />

      {tab === 'models' && (
        <>
          <DataTable
            columns={[
              { key: 'id', header: 'ID', width: 88 },
              {
                key: 'name',
                header: 'Use case',
                render: (r) => <span className="font-medium text-ink-900">{r.name}</span>,
              },
              { key: 'where', header: 'Where it appears', className: 'max-w-xs' },
              { key: 'dataIn', header: 'Data in', className: 'max-w-xs' },
              { key: 'dataOut', header: 'Data out', className: 'max-w-xs' },
              { key: 'phase', header: 'Phase', align: 'right' },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <Badge tone={r.status === 'live' ? 'green' : r.status === 'pilot' ? 'amber' : 'slate'}>
                    {r.status}
                  </Badge>
                ),
              },
              {
                key: '_t',
                header: 'Enabled',
                sortable: false,
                align: 'right',
                render: (r) => (
                  <div className="flex justify-end w-14">
                    <Toggle
                      checked={enabled[r.id]}
                      onChange={(v) => {
                        setEnabled((e) => ({ ...e, [r.id]: v }))
                        toast({
                          title: `${r.name} ${v ? 'enabled' : 'disabled'}`,
                          body: 'Feature flag applied to this jurisdiction.',
                        })
                      }}
                    />
                  </div>
                ),
              },
            ]}
            rows={aiUseCases}
            exportName="ai-models"
            searchKeys={['name', 'where', 'dataIn', 'dataOut']}
            pageSize={15}
          />
          <Card className="mt-4">
            <CardHeader
              title="How each model reaches a screen"
              subtitle="Consumers, so a change to a model has a known blast radius"
            />
            <CardBody className="space-y-2">
              {aiUseCases
                .filter((u) => u.status !== 'planned')
                .map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-200 px-3 py-2.5"
                  >
                    <span className="text-[12.5px] text-ink-900 font-medium">{u.name}</span>
                    <span className="text-ink-300">→</span>
                    <span className="text-[12.5px] text-ink-600 flex-1">{u.consumers}</span>
                  </div>
                ))}
            </CardBody>
          </Card>
        </>
      )}

      {tab === 'assistants' && (
        <div className="grid gap-4 lg:grid-cols-3">
          {assistants.map((a) => (
            <Card key={a.id}>
              <CardHeader
                title={a.name}
                subtitle={a.users}
                icon={Bot}
                action={<Badge tone={a.status === 'live' ? 'green' : 'amber'}>{a.status}</Badge>}
              />
              <CardBody className="space-y-3">
                {[
                  ['Where', a.where],
                  ['Data in', a.dataIn],
                  ['Data out', a.dataOut],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[11px] uppercase tracking-wider text-ink-400 mb-1">{tx(k)}</p>
                    <p className="text-[12.5px] text-ink-700 leading-relaxed">{v}</p>
                  </div>
                ))}
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink-400 mb-1">Capabilities</p>
                  <ul className="space-y-1">
                    {a.can.map((c) => (
                      <li key={c} className="flex gap-2 text-[12.5px] text-ink-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardBody>
            </Card>
          ))}
          <Card className="lg:col-span-3">
            <CardHeader title="Conversation path" subtitle="Identical for all three assistants" />
            <CardBody>
              <ol className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-600">
                {[
                  'User question (text or voice)',
                  'API gateway — auth, scope, language',
                  'Orchestrator',
                  'Knowledge base (retrieval) + read-only platform APIs',
                  'Answer with source + action button',
                  'Escalate to a human on low confidence or a complaint',
                ].map((s, i, arr) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5">{s}</span>
                    {i < arr.length - 1 && <span className="text-ink-300">→</span>}
                  </li>
                ))}
              </ol>
              <p className="text-[12px] text-ink-400 mt-3">
                Any transaction — booking, refund or SOS — is handed back to the normal UI for the user to confirm. The
                assistant never completes one on its own.
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'guardrails' && (
        <Card>
          <CardHeader
            title="Guardrails"
            icon={ShieldCheck}
            subtitle="Enforced at the gateway, not left to the prompt"
          />
          <CardBody>
            <ul className="space-y-2.5">
              {guardrails.map((g) => (
                <li key={g.id} className="flex gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                  <Badge tone="slate" className="shrink-0 self-start">
                    {g.id}
                  </Badge>
                  <span className="text-[12.5px] text-ink-700 leading-relaxed">{g.text}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {tab === 'kpis' && (
        <Card>
          <CardHeader title="Model quality" subtitle="Reviewed monthly, with a hallucination audit on the assistants" />
          <CardBody className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {aiKpis.map((k) => {
              const met = k.lowerBetter ? k.value <= k.target : k.value >= k.target
              const pct = k.lowerBetter
                ? Math.min(100, (k.target / k.value) * 100)
                : Math.min(100, (k.value / k.target) * 100)
              return (
                <div key={k.name}>
                  <div className="flex justify-between text-[12.5px] mb-1">
                    <span className="text-ink-600">{k.name}</span>
                    <span className={met ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                      {k.value}
                      {k.unit.startsWith('/') ? ` ${k.unit}` : k.unit} · target {k.target}
                      {k.unit.startsWith('/') ? '' : k.unit}
                    </span>
                  </div>
                  <Progress value={pct} tone={met ? 'green' : 'amber'} />
                </div>
              )
            })}
          </CardBody>
        </Card>
      )}
    </>
  )
}
