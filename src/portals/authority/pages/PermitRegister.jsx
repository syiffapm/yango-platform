import { useState } from 'react'
import { useTx } from '../../../lib/adminLang.js'
import { Link } from 'react-router-dom'
import { Ban, ScanLine, ScrollText } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import Drawer from '../../../components/ui/Drawer.jsx'
import Badge, { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Qr from '../../../components/ui/Qr.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import useAuthority from '../useAuthority.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { dateOnly, daysUntil, dt } from '../../../lib/format.js'
import { licenceTypes } from '../../../data/org.js'
export default function PermitRegister() {
  const tx = useTx()
  const { db, update, audit, notify, me, can } = useAuthority()
  const toast = useToast()
  const [sel, setSel] = useState(null)
  const [suspending, setSuspending] = useState(false)
  const rows = db.permits.map((p) => ({
    ...p,
    typeLabel: licenceTypes.find((t) => t.code === p.type)?.label || p.type,
    days: daysUntil(p.expiry),
  }))
  const suspend = (reason) => {
    update((d) => {
      const p = d.permits.find((x) => x.id === sel.id)
      p.status = p.status === 'suspended' ? 'valid' : 'suspended'
      p.version += 1
      p.history.unshift({
        at: new Date().toISOString(),
        by: me.id,
        action: p.status === 'suspended' ? 'Suspended' : 'Reinstated',
        reason,
      })
      if (p.holderType === 'vehicle') {
        const v = d.vehicles.find((x) => x.id === p.holder)
        if (v) v.status = p.status === 'suspended' ? 'blocked' : 'active'
      }
      if (p.holderType === 'driver') {
        const drv = d.drivers.find((x) => x.id === p.holder)
        if (drv) drv.status = p.status === 'suspended' ? 'blocked' : 'active'
      }
    })
    audit({
      actor: me.id,
      role: me.role,
      action: sel.status === 'suspended' ? 'Reinstated permit' : 'Suspended permit',
      object: sel.id,
      reason,
      category: 'Administration',
    })
    notify({
      audience: 'operator',
      title: `Permit ${sel.status === 'suspended' ? 'reinstated' : 'suspended'} — ${sel.id}`,
      body: reason,
    })
    toast({
      title: sel.status === 'suspended' ? 'Permit reinstated' : 'Permit suspended',
      body:
        sel.status === 'suspended'
          ? 'The holder may sell and operate again.'
          : 'New schedules are blocked, the holder is hidden from sale and driver check-in is blocked.',
    })
    setSuspending(false)
    setSel(null)
  }
  return (
    <>
      <PageHeader
        title="Permit register"
        subtitle="Every permit with its terms and change history. Changes are versioned and never retroactive to findings already issued."
        meta={
          <Badge tone="brand" icon={ScrollText}>
            {rows.length} permits
          </Badge>
        }
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Valid"
          value={rows.filter((r) => r.status === 'valid').length}
          tone="good"
          method="Permits in force today."
        />
        <Stat
          label="Suspended"
          value={rows.filter((r) => r.status === 'suspended').length}
          tone="bad"
          method="Automatic effects: block new schedules, hide from sale, flag on the map, block driver shift start."
        />
        <Stat
          label="Expiring ≤ 30 days"
          value={rows.filter((r) => r.days <= 30 && r.days > 0).length}
          tone="warn"
          method="Final reminder window before expiry."
        />
        <Stat
          label="Route permits"
          value={rows.filter((r) => r.type === 'ROUTE').length}
          method="Trayek permits across all operators, with hours, headway and vehicle terms."
        />
      </StatGrid>

      <DataTable
        columns={[
          {
            key: 'id',
            header: 'Permit',
            width: 160,
            render: (r) => <span className="font-mono text-[12.5px]">{r.id}</span>,
          },
          { key: 'typeLabel', header: 'Type' },
          { key: 'holderName', header: 'Holder' },
          { key: 'routeLabel', header: 'Scope', render: (r) => r.routeLabel || r.terms?.class || '—' },
          { key: 'issued', header: 'Issued', render: (r) => dateOnly(r.issued) },
          { key: 'expiry', header: 'Expiry', render: (r) => dateOnly(r.expiry) },
          { key: 'version', header: 'Ver', align: 'right', render: (r) => <Badge tone="slate">v{r.version}</Badge> },
          { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
        ]}
        rows={rows}
        onRowClick={setSel}
        searchKeys={['id', 'holderName', 'typeLabel', 'routeLabel']}
        filters={[
          { key: 'type', label: 'Type', options: licenceTypes.map((t) => ({ value: t.code, label: t.label })) },
          {
            key: 'status',
            label: 'Status',
            options: ['valid', 'suspended', 'pending'].map((s) => ({ value: s, label: s })),
          },
        ]}
        exportName="permit-register"
        pageSize={14}
      />

      <Drawer
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.id}
        subtitle={sel ? `${sel.typeLabel || sel.type} · ${sel.holderName}` : ''}
        footer={
          sel &&
          (can.approveLicence ? (
            <Button
              variant={sel.status === 'suspended' ? 'primary' : 'danger'}
              icon={Ban}
              onClick={() => setSuspending(true)}
            >
              {sel.status === 'suspended' ? 'Reinstate permit' : 'Suspend permit'}
            </Button>
          ) : (
            <Badge tone="amber">Only a licensing approver may suspend or reinstate</Badge>
          ))
        }
      >
        {sel && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Qr value={sel.id} size={96} className="border border-ink-200 shrink-0" />
              <div className="min-w-0">
                <StatusPill status={sel.status} />
                <p className="text-[13px] font-medium text-ink-900 mt-2">{sel.holderName}</p>
                <p className="text-[12.5px] text-ink-500">{sel.routeLabel || sel.terms?.class}</p>
                <Button size="xs" className="mt-2" icon={ScanLine} as={Link} to={`/verify/${sel.id}`}>
                  Public verification
                </Button>
              </div>
            </div>

            <dl className="divide-y divide-ink-100 border-y border-ink-100">
              {[
                ['Issued', dateOnly(sel.issued)],
                ['Expiry', `${dateOnly(sel.expiry)} (${daysUntil(sel.expiry)} days)`],
                ['Version', `v${sel.version}`],
                sel.terms?.hours && ['Permitted hours', sel.terms.hours],
                sel.terms?.minHeadwayMin && ['Minimum headway', `${sel.terms.minHeadwayMin} min`],
                sel.terms?.vehiclesRequired && [
                  'Vehicles required / held',
                  `${sel.terms.vehiclesRequired} / ${sel.terms.vehiclesHeld}`,
                ],
                sel.terms?.class && ['Class', sel.terms.class],
              ]
                .filter(Boolean)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-[12.5px] text-ink-500">{tx(k)}</dt>
                    <dd className="text-[12px] text-ink-900 text-right">{v}</dd>
                  </div>
                ))}
            </dl>

            <div>
              <p className="text-[12px] uppercase tracking-wider text-ink-400 mb-2">Change history</p>
              {sel.history?.length ? (
                sel.history.map((h, i) => (
                  <div key={i} className="rounded-lg border border-ink-200 p-3 mb-2">
                    <p className="text-[12px] font-medium text-ink-900">{h.action}</p>
                    <p className="text-[12.5px] text-ink-600 mt-0.5 leading-relaxed">“{h.reason}”</p>
                    <p className="text-[11.5px] text-ink-400 mt-1">
                      {db.users.find((u) => u.id === h.by)?.name} · {dt(h.at)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[12.5px] text-ink-400">No changes since issue.</p>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ReasonDialog
        open={suspending}
        onClose={() => setSuspending(false)}
        onConfirm={suspend}
        title={sel?.status === 'suspended' ? 'Reinstate permit' : 'Suspend permit'}
        confirmLabel={sel?.status === 'suspended' ? 'Reinstate' : 'Suspend'}
        variant={sel?.status === 'suspended' ? 'primary' : 'danger'}
        minLength={25}
        subtitle={
          sel?.status === 'suspended'
            ? 'Reinstating allows the holder to sell and operate again from the moment it is saved.'
            : 'Suspension blocks new schedules, hides the holder from sale, flags the vehicle on the map and blocks driver shift start.'
        }
      />
    </>
  )
}
