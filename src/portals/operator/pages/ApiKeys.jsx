import { useState } from 'react'
import { Copy, KeyRound, Plus, Webhook } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Field, Input, Toggle } from '../../../components/ui/Field.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import useOperator from '../useOperator.js'
const EVENTS = [
  'booking.created',
  'booking.cancelled',
  'checkin.scanned',
  'trip.started',
  'trip.ended',
  'sos.raised',
  'settlement.paid',
]
export default function ApiKeys() {
  const { op } = useOperator()
  const toast = useToast()
  const [keys, setKeys] = useState([
    {
      id: 'K1',
      label: 'Production — reservations system',
      prefix: `yg_live_${op.short.toLowerCase()}`,
      created: '2026-04-12',
      scopes: ['bookings:read', 'manifest:read'],
    },
    {
      id: 'K2',
      label: 'Sandbox',
      prefix: `yg_test_${op.short.toLowerCase()}`,
      created: '2026-04-12',
      scopes: ['bookings:read'],
    },
  ])
  const [hooks, setHooks] = useState(
    Object.fromEntries(EVENTS.map((e) => [e, ['booking.created', 'sos.raised'].includes(e)])),
  )
  const [url, setUrl] = useState('https://ops.example.mm/yango/webhook')
  const copy = (t) => {
    navigator.clipboard?.writeText(t)
    toast({ title: 'Copied to clipboard' })
  }
  const create = () => {
    setKeys((k) => [
      ...k,
      {
        id: `K${k.length + 1}`,
        label: 'New key',
        prefix: `yg_live_${op.short.toLowerCase()}`,
        created: new Date().toISOString().slice(0, 10),
        scopes: ['bookings:read'],
      },
    ])
    toast({ title: 'API key created', body: 'The secret is shown once — store it securely.' })
  }
  return (
    <>
      <PageHeader
        title="API & webhooks"
        subtitle="API keys and webhooks for booking, check-in and SOS so your own reservation or fleet system stays in step. All APIs are OpenAPI 3 and rate-limited at the gateway."
        actions={
          <Button variant="primary" icon={Plus} onClick={create}>
            Create key
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="API keys" icon={KeyRound} />
          <CardBody className="space-y-2">
            {keys.map((k) => (
              <div key={k.id} className="rounded-lg border border-ink-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12.5px] font-medium text-ink-900">{k.label}</p>
                  <Badge tone={k.prefix.includes('test') ? 'slate' : 'green'}>
                    {k.prefix.includes('test') ? 'Sandbox' : 'Live'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 text-[12px] bg-ink-50 border border-ink-200 rounded px-2 py-1.5 font-mono truncate">
                    {k.prefix}_••••••••••••
                  </code>
                  <Button size="xs" icon={Copy} onClick={() => copy(`${k.prefix}_secret`)}>
                    Copy
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {k.scopes.map((s) => (
                    <Badge key={s} tone="brand">
                      {s}
                    </Badge>
                  ))}
                </div>
                <p className="text-[11.5px] text-ink-400 mt-2">Created {k.created}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Webhooks"
            icon={Webhook}
            subtitle="Signed with an HMAC header; retried with exponential backoff"
          />
          <CardBody className="space-y-3">
            <Field label="Endpoint URL">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} />
            </Field>
            <div className="space-y-1">
              <p className="text-[12.5px] font-medium text-ink-600 mb-1">Events</p>
              {EVENTS.map((e) => (
                <Toggle key={e} label={e} checked={hooks[e]} onChange={(v) => setHooks((h) => ({ ...h, [e]: v }))} />
              ))}
            </div>
            <Button
              variant="primary"
              onClick={() =>
                toast({
                  title: 'Webhook saved',
                  body: `${Object.values(hooks).filter(Boolean).length} events will be delivered to ${url}.`,
                })
              }
            >
              Save webhook
            </Button>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
