import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Boxes, Layers, Plug, Sparkles, LayoutList } from 'lucide-react'
import Tabs from '../../components/ui/Tabs.jsx'
import DataTable from '../../components/ui/Table.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Stat, { StatGrid } from '../../components/ui/Stat.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { backendServices, platformComponents, pageInventory, integrationCatalogue } from '../../data/blueprint.js'
import { aiUseCases, assistants, guardrails } from '../../data/ai.js'

const DOMAIN_TONE = {
  Identity: 'violet',
  Registry: 'brand',
  Network: 'blue',
  Sales: 'green',
  Money: 'amber',
  Operations: 'red',
  Engagement: 'slate',
  'Data & AI': 'violet',
}

export default function Blueprint() {
  const [tab, setTab] = useState('services')
  const totalPages = pageInventory.reduce((s, p) => s + p.count, 0)

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-white border-b border-ink-200">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 rounded-xl bg-brand-600 text-white grid place-items-center text-[13px] font-bold"
          >
            YG
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-ink-900 leading-tight">Solution blueprint</p>
            <p className="text-[12px] text-ink-500 leading-tight">
              Backend services, page inventory, integrations and AI scope — BRD sections 16, 18–20
            </p>
          </div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] text-ink-500 hover:text-ink-800">
            <ArrowLeft size={14} /> Portals
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6">
        <StatGrid cols={4} className="mb-5">
          <Stat
            label="Backend services"
            value={backendServices.length}
            icon={Boxes}
            method="Microservices across eight domains behind one API gateway, each with its own schema and audit writes."
          />
          <Stat
            label="Pages"
            value={totalPages}
            icon={LayoutList}
            method="Screens across six channels, counted per menu group."
          />
          <Stat
            label="External integrations"
            value={integrationCatalogue.length}
            icon={Plug}
            method="Each sits behind an adapter with retries, circuit breaker, PII-masked logging, sandbox mode and a documented manual fallback."
          />
          <Stat
            label="AI use cases"
            value={aiUseCases.length}
            icon={Sparkles}
            method="Plus three assistants on one LLM gateway. Every output is advisory."
          />
        </StatGrid>

        <Tabs
          value={tab}
          onChange={setTab}
          className="mb-4"
          tabs={[
            { value: 'services', label: 'Backend services', count: backendServices.length },
            { value: 'pages', label: 'Page inventory', count: totalPages },
            { value: 'integrations', label: 'Integrations', count: integrationCatalogue.length },
            { value: 'ai', label: 'AI & chatbot', count: aiUseCases.length + assistants.length },
          ]}
        />

        {tab === 'services' && (
          <>
            <DataTable
              columns={[
                { key: 'n', header: '#', width: 50 },
                {
                  key: 'domain',
                  header: 'Domain',
                  render: (r) => <Badge tone={DOMAIN_TONE[r.domain]}>{r.domain}</Badge>,
                },
                {
                  key: 'service',
                  header: 'Service',
                  render: (r) => <span className="font-medium text-ink-900">{r.service}</span>,
                },
                { key: 'responsibility', header: 'Responsibility', className: 'max-w-md' },
                { key: 'consumers', header: 'Consumed by' },
              ]}
              rows={backendServices.map((s) => ({ ...s, id: s.n }))}
              exportName="backend-services"
              searchKeys={['service', 'domain', 'responsibility', 'consumers']}
              filters={[
                {
                  key: 'domain',
                  label: 'Domain',
                  options: [...new Set(backendServices.map((s) => s.domain))].map((d) => ({ value: d, label: d })),
                },
              ]}
              pageSize={20}
            />
            <Card className="mt-4">
              <CardHeader title="Shared platform components" icon={Layers} />
              <CardBody className="flex flex-wrap gap-2">
                {platformComponents.map((c) => (
                  <Badge key={c} tone="slate">
                    {c}
                  </Badge>
                ))}
              </CardBody>
            </Card>
          </>
        )}

        {tab === 'pages' && (
          <DataTable
            columns={[
              { key: 'channel', header: 'Channel', render: (r) => <Badge tone="brand">{r.channel}</Badge> },
              {
                key: 'group',
                header: 'Menu group',
                render: (r) => <span className="font-medium text-ink-900">{r.group}</span>,
              },
              { key: 'count', header: 'Pages', align: 'right' },
              { key: 'scope', header: 'Scope', className: 'max-w-xl' },
            ]}
            rows={pageInventory.map((p, i) => ({ ...p, id: i }))}
            exportName="page-inventory"
            searchKeys={['channel', 'group', 'scope']}
            filters={[
              {
                key: 'channel',
                label: 'Channel',
                options: [...new Set(pageInventory.map((p) => p.channel))].map((c) => ({ value: c, label: c })),
              },
            ]}
            pageSize={25}
          />
        )}

        {tab === 'integrations' && (
          <DataTable
            columns={[
              { key: 'id', header: 'ID', width: 80 },
              {
                key: 'engine',
                header: 'Engine',
                render: (r) => <span className="font-medium text-ink-900">{r.engine}</span>,
              },
              { key: 'counterparty', header: 'Counterparty (to be confirmed)', className: 'max-w-sm' },
              { key: 'exchange', header: 'Data exchanged', className: 'max-w-sm' },
              {
                key: 'priority',
                header: 'Pri',
                width: 60,
                render: (r) => <Badge tone={r.priority === 'M' ? 'red' : 'amber'}>{r.priority}</Badge>,
              },
              { key: 'fallback', header: 'Manual fallback', className: 'max-w-sm' },
            ]}
            rows={integrationCatalogue}
            exportName="integration-catalogue"
            searchKeys={['engine', 'counterparty', 'exchange']}
            pageSize={20}
          />
        )}

        {tab === 'ai' && (
          <div className="space-y-4">
            <DataTable
              columns={[
                { key: 'id', header: 'ID', width: 90 },
                {
                  key: 'name',
                  header: 'Use case',
                  render: (r) => <span className="font-medium text-ink-900">{r.name}</span>,
                },
                { key: 'where', header: 'Where (menu / page)', className: 'max-w-sm' },
                { key: 'dataIn', header: 'Data in', className: 'max-w-sm' },
                { key: 'dataOut', header: 'Data out', className: 'max-w-sm' },
                {
                  key: 'priority',
                  header: 'Pri',
                  width: 60,
                  render: (r) => (
                    <Badge tone={r.priority === 'M' ? 'red' : r.priority === 'S' ? 'amber' : 'slate'}>
                      {r.priority}
                    </Badge>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => (
                    <Badge tone={r.status === 'live' ? 'green' : r.status === 'pilot' ? 'amber' : 'slate'}>
                      {r.status}
                    </Badge>
                  ),
                },
              ]}
              rows={aiUseCases}
              exportName="ai-use-cases"
              searchKeys={['name', 'where', 'dataIn', 'dataOut']}
              pageSize={15}
            />

            <div className="grid gap-3 lg:grid-cols-3">
              {assistants.map((a) => (
                <Card key={a.id}>
                  <CardHeader
                    title={a.name}
                    subtitle={`${a.id} · ${a.users}`}
                    action={<Badge tone={a.status === 'live' ? 'green' : 'amber'}>{a.status}</Badge>}
                  />
                  <CardBody className="space-y-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-ink-400 mb-1">Where</p>
                      <p className="text-[12.5px] text-ink-700 leading-relaxed">{a.where}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-ink-400 mb-1">Can do</p>
                      <ul className="space-y-1">
                        {a.can.map((c) => (
                          <li key={c} className="flex gap-2 text-[12.5px] text-ink-700">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-ink-400 mb-1">Data in</p>
                      <p className="text-[12.5px] text-ink-600 leading-relaxed">{a.dataIn}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-ink-400 mb-1">Data out</p>
                      <p className="text-[12.5px] text-ink-600 leading-relaxed">{a.dataOut}</p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader title="Guardrails that apply to every model and assistant" icon={Sparkles} />
              <CardBody>
                <ul className="space-y-2">
                  {guardrails.map((g) => (
                    <li key={g.id} className="flex gap-2.5 text-[12px] text-ink-700">
                      <Badge tone="slate" className="shrink-0">
                        {g.id}
                      </Badge>
                      <span className="leading-relaxed">{g.text}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
