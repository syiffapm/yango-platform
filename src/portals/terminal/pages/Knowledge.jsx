import { useState } from 'react'
import { useTx } from '../../../lib/adminLang.js'
import { BookOpen, Bot, FileText, Plus, Scale } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
const FAQS = [
  {
    id: 1,
    q: 'How long is an urban ticket valid?',
    a: 'Until 23:59 on the day you buy it. Transfers on the same journey are included.',
    lang: 'EN · MM',
    bot: true,
  },
  {
    id: 2,
    q: 'Can I get a refund?',
    a: '90% more than 24 h before departure, 50% within 2–24 h, none within 2 h. A trip cancelled by the operator is always refunded in full.',
    lang: 'EN · MM',
    bot: true,
  },
  {
    id: 3,
    q: 'What do I do if I left something on the bus?',
    a: 'Open a lost-property case from Safety → Report. The operator checks the depot and replies within 48 hours.',
    lang: 'EN · MM',
    bot: true,
  },
  {
    id: 4,
    q: 'How do I verify a bus is licensed?',
    a: 'Scan the QR on the windscreen. The public verification page shows the permit status, the operator and the validity.',
    lang: 'EN',
    bot: true,
  },
  {
    id: 5,
    q: 'Is my report anonymous?',
    a: 'If you choose anonymous, your identity is never stored with the incident. Time and place are still recorded and you keep the reference number.',
    lang: 'EN · MM',
    bot: true,
  },
  {
    id: 6,
    q: 'Which concessions are available?',
    a: 'Student and elderly 50%, disability and children under 6 travel free. Proof is checked once against the national ID registry.',
    lang: 'EN · MM',
    bot: true,
  },
]
const LEGAL = [
  { id: 'terms', name: 'Terms of use', version: 'v3', updated: '2026-06-01', approved: 'Legal directorate' },
  { id: 'privacy', name: 'Privacy notice', version: 'v4', updated: '2026-08-14', approved: 'Data protection officer' },
  {
    id: 'refund',
    name: 'Refund and passenger-protection policy',
    version: 'v2',
    updated: '2026-03-20',
    approved: 'YRTC',
  },
  { id: 'ads', name: 'Advertising policy', version: 'v1', updated: '2026-01-10', approved: 'Ministry' },
  { id: 'accessibility', name: 'Accessibility statement', version: 'v1', updated: '2026-02-02', approved: 'YRTC' },
]
export default function Knowledge() {
  const tx = useTx()
  const [tab, setTab] = useState('faq')
  const toast = useToast()
  return (
    <>
      <PageHeader
        title="FAQs & legal pages"
        subtitle="The same articles serve the help centre and the Ask YanGo knowledge base, so the chatbot can only answer from approved content."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() =>
              toast({ title: 'Article created', body: 'Drafts go to the authority for approval before publish.' })
            }
          >
            New article
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { value: 'faq', label: 'FAQs', count: FAQS.length },
          { value: 'legal', label: 'Legal pages', count: LEGAL.length },
          { value: 'bot', label: 'Chatbot knowledge base' },
        ]}
      />

      {tab === 'faq' && (
        <div className="space-y-2">
          {FAQS.map((f) => (
            <Card key={f.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink-900">{f.q}</p>
                    <p className="text-[12px] text-ink-600 mt-1 leading-relaxed">{f.a}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge tone="brand">{f.lang}</Badge>
                    {f.bot && (
                      <Badge tone="violet" icon={Bot}>
                        In KB
                      </Badge>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {tab === 'legal' && (
        <DataTable
          search={false}
          columns={[
            {
              key: 'name',
              header: 'Page',
              render: (r) => (
                <span className="inline-flex items-center gap-2">
                  <FileText size={14} className="text-ink-400" />
                  {r.name}
                </span>
              ),
            },
            { key: 'version', header: 'Version', render: (r) => <Badge tone="slate">{r.version}</Badge> },
            { key: 'updated', header: 'Last updated' },
            { key: 'approved', header: 'Approved by' },
            { key: '_a', header: '', sortable: false, align: 'right', render: () => <Button size="xs">Edit</Button> },
          ]}
          rows={LEGAL}
        />
      )}

      {tab === 'bot' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Knowledge base"
              icon={BookOpen}
              subtitle="Retrieval sources the assistants may quote from"
            />
            <CardBody className="space-y-2">
              {[
                ['FAQs and help articles', `${FAQS.length} articles · EN + MM`],
                ['Legal pages', `${LEGAL.length} documents`],
                ['Terminal registry', '4 terminals with facilities and bays'],
                ['Fare engine', 'Live fares and caps per line'],
                ['Regulation library', 'Permit terms and service standards'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                  <span className="flex-1 text-[12.5px] text-ink-800">{tx(k)}</span>
                  <span className="text-[12px] text-ink-500">{v}</span>
                  <Badge tone="green">Indexed</Badge>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Guardrails" icon={Scale} subtitle="Applied to every assistant on every turn" />
            <CardBody>
              <ul className="space-y-2 text-[12px] text-ink-600">
                {[
                  'Only the user’s own session data enters a prompt; PII is redacted in logs.',
                  'Answers cite the source article or data; legal and medical advice is refused.',
                  'Safety keywords surface the SOS button immediately.',
                  'Transactions are handed back to the normal UI for the user to confirm.',
                  'Logs are kept 90 days and used for training only in anonymised form with consent.',
                  'Monthly hallucination audit; containment rate, CSAT and escalation rate are reported.',
                ].map((g) => (
                  <li key={g} className="flex gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  )
}
