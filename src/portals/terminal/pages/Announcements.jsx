import { useState } from 'react'
import { Plus, Send } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Field, Input, Select, Textarea, Checkbox } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { routes } from '../../../data/geo.js'
import { dt } from '../../../lib/format.js'
export default function Announcements() {
  const { db, update, notify } = useDb()
  const toast = useToast()
  const [draft, setDraft] = useState(null)
  const create = () => {
    const id = `ANN-${String(10 + db.announcements.length)}`
    update((d) => {
      d.announcements.unshift({
        id,
        title: draft.title,
        titleMM: draft.titleMM || null,
        body: draft.body,
        severity: draft.severity,
        routes: draft.route ? [draft.route] : [],
        from: new Date().toISOString(),
        to: new Date(Date.now() + 7 * 86400000).toISOString(),
        status: 'draft',
        lang: draft.mm ? ['en', 'mm'] : ['en'],
      })
    })
    notify({
      audience: 'authority',
      title: 'Content awaiting approval',
      body: `“${draft.title}” needs approval before it can be published.`,
    })
    toast({
      title: 'Draft saved',
      body: 'Multilingual content must be approved by the authority before it is published.',
    })
    setDraft(null)
  }
  return (
    <>
      <PageHeader
        title="Announcements & service alerts"
        subtitle="Target routes and areas, set a validity window and a severity. Published alerts appear in the Citizen App, on the departure board and as a push notification."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setDraft({ title: '', body: '', severity: 'info', route: '', mm: true })}
          >
            New announcement
          </Button>
        }
      />

      <DataTable
        columns={[
          {
            key: 'title',
            header: 'Title',
            render: (r) => (
              <div>
                <p className="font-medium text-ink-900">{r.title}</p>
                {r.titleMM && <p className="text-[11.5px] text-ink-400">{r.titleMM}</p>}
              </div>
            ),
          },
          {
            key: 'severity',
            header: 'Severity',
            render: (r) => (
              <Badge tone={r.severity === 'critical' ? 'red' : r.severity === 'warning' ? 'amber' : 'blue'}>
                {r.severity}
              </Badge>
            ),
          },
          {
            key: 'routes',
            header: 'Affects',
            sortable: false,
            render: (r) => (
              <span className="flex flex-wrap gap-1">
                {r.routes.length ? (
                  r.routes.map((x) => (
                    <Badge key={x} tone="slate">
                      {routes.find((ro) => ro.id === x)?.line}
                    </Badge>
                  ))
                ) : (
                  <span className="text-ink-400">Network-wide</span>
                )}
              </span>
            ),
          },
          {
            key: 'lang',
            header: 'Languages',
            sortable: false,
            render: (r) => (
              <span className="flex gap-1">
                {r.lang.map((l) => (
                  <Badge key={l} tone="brand">
                    {l.toUpperCase()}
                  </Badge>
                ))}
              </span>
            ),
          },
          { key: 'from', header: 'From', render: (r) => dt(r.from) },
          { key: 'to', header: 'Until', render: (r) => dt(r.to) },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
        ]}
        rows={db.announcements}
        exportName="announcements"
        empty="No announcements"
      />

      <p className="text-[12px] text-ink-400 mt-3">
        Approval happens in the Authority Console under Ads &amp; content. Safety messages always reach passengers even
        if they have turned other notifications off.
      </p>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title="New announcement"
        subtitle="Drafts go to the authority for approval before they are published."
        footer={
          <>
            <Button onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="primary" icon={Send} disabled={!draft?.title || !draft?.body} onClick={create}>
              Save draft
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Title (English)" required>
            <Input value={draft?.title || ''} onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))} />
          </Field>
          <Field label="Title (Myanmar)" hint="Unicode; Zawgyi input is converted automatically">
            <Input
              value={draft?.titleMM || ''}
              onChange={(e) => setDraft((s) => ({ ...s, titleMM: e.target.value }))}
            />
          </Field>
          <Field label="Body" required>
            <Textarea
              rows={4}
              value={draft?.body || ''}
              onChange={(e) => setDraft((s) => ({ ...s, body: e.target.value }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Severity">
              <Select value={draft?.severity} onChange={(e) => setDraft((s) => ({ ...s, severity: e.target.value }))}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </Select>
            </Field>
            <Field label="Affected line">
              <Select value={draft?.route || ''} onChange={(e) => setDraft((s) => ({ ...s, route: e.target.value }))}>
                <option value="">Network-wide</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.line} · {r.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Checkbox
            checked={draft?.mm}
            onChange={(e) => setDraft((s) => ({ ...s, mm: e.target.checked }))}
            label="Publish in Myanmar as well as English"
          />
        </div>
      </Modal>
    </>
  )
}
