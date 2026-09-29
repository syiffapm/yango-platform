import { useState } from 'react'
import { Building2, Plus, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { Field, Input } from '../../../components/ui/Field.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK } from '../../../lib/format.js'
export default function Advertisers() {
  const { db } = useDb()
  const toast = useToast()
  const [adding, setAdding] = useState(null)
  const [extra, setExtra] = useState([])
  const fromCampaigns = [...new Set(db.campaigns.map((c) => c.advertiser))].map((name, i) => ({
    id: `ADV-${100 + i}`,
    name,
    kyc: name.includes('Casino') ? 'rejected' : 'verified',
    campaigns: db.campaigns.filter((c) => c.advertiser === name).length,
    spend: db.campaigns.filter((c) => c.advertiser === name && c.status === 'live').reduce((s, c) => s + c.budget, 0),
    contact: `ads@${name
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .slice(0, 10)}.mm`,
  }))
  const rows = [...extra, ...fromCampaigns]
  const add = () => {
    setExtra((e) => [
      {
        id: `ADV-${900 + e.length}`,
        name: adding.name,
        kyc: 'pending',
        campaigns: 0,
        spend: 0,
        contact: adding.contact,
      },
      ...e,
    ])
    toast({ title: 'Advertiser account created', body: 'Company KYC must pass before a campaign can go live.' })
    setAdding(null)
  }
  return (
    <>
      <PageHeader
        title="Advertiser accounts"
        subtitle="Self-service accounts with company KYC, plus operator campaigns booked from the PO Portal."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setAdding({ name: '', contact: '' })}>
            Add advertiser
          </Button>
        }
      />

      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Advertiser',
            render: (r) => (
              <span className="inline-flex items-center gap-2">
                <Building2 size={14} className="text-ink-400" />
                {r.name}
              </span>
            ),
          },
          { key: 'contact', header: 'Contact' },
          { key: 'campaigns', header: 'Campaigns', align: 'right' },
          { key: 'spend', header: 'Live spend', align: 'right', render: (r) => MMK(r.spend) },
          {
            key: 'kyc',
            header: 'Company KYC',
            render: (r) =>
              r.kyc === 'verified' ? (
                <Badge tone="green" icon={ShieldCheck}>
                  Verified
                </Badge>
              ) : (
                <StatusPill status={r.kyc} />
              ),
          },
        ]}
        rows={rows}
        exportName="advertisers"
      />

      <Modal
        open={!!adding}
        onClose={() => setAdding(null)}
        title="Add an advertiser"
        subtitle="Company registration is checked against the company registry before any campaign can go live."
        footer={
          <>
            <Button onClick={() => setAdding(null)}>Cancel</Button>
            <Button variant="primary" disabled={!adding?.name} onClick={add}>
              Create account
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Company name" required>
            <Input value={adding?.name || ''} onChange={(e) => setAdding((s) => ({ ...s, name: e.target.value }))} />
          </Field>
          <Field label="Billing contact" required>
            <Input
              type="email"
              value={adding?.contact || ''}
              onChange={(e) => setAdding((s) => ({ ...s, contact: e.target.value }))}
            />
          </Field>
          <Field label="Company registration number" hint="Verified against DICA MyCO">
            <Input placeholder="101234567" />
          </Field>
        </div>
      </Modal>
    </>
  )
}
