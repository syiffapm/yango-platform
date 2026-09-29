import { useState } from 'react'
import { Lock, Gauge } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import { Field, Input } from '../../../components/ui/Field.jsx'
import ReasonDialog from '../../../components/domain/ReasonDialog.jsx'
import useAuthority from '../useAuthority.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { MMK, dt } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
export default function Thresholds() {
  const { db, update, audit, me, can } = useAuthority()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [value, setValue] = useState('')
  const t = db.thresholds
  const commit = (reason) => {
    update((d) => {
      const th = d.thresholds
      if (editing.kind === 'sla') th.sla[editing.key] = Number(value)
      if (editing.kind === 'standard') {
        const s = th.serviceStandards.find((x) => x.class === editing.key)
        s[editing.field] = Number(value)
      }
      if (editing.kind === 'spare') th.spareRatio = Number(value)
      if (editing.kind === 'cap') {
        const c = d.fareCaps.find((x) => x.route === editing.key)
        c.cap = Number(value)
        c.version += 1
        c.reason = reason
      }
      if (editing.kind === 'floor') {
        const c = d.fareCaps.find((x) => x.route === editing.key)
        c.floor = Number(value)
        c.version += 1
        c.reason = reason
      }
      th.version += 1
      th.updatedAt = new Date().toISOString()
      th.updatedBy = me.id
      th.reason = reason
    })
    audit({
      actor: me.id,
      role: me.role,
      action: 'Changed threshold',
      object: `${editing.label} → ${value}`,
      reason,
      category: 'Administration',
    })
    toast({
      title: 'Threshold updated',
      body: 'Applies from now on. Findings already issued and reports already published keep the old rule.',
    })
    setEditing(null)
  }
  const open = (kind, key, label, current, field) => {
    if (!can.changeThreshold) {
      toast({ title: 'Not permitted', body: 'Only the national policy officer may change thresholds.', kind: 'error' })
      return
    }
    setEditing({ kind, key, label, field })
    setValue(String(current))
  }
  return (
    <>
      <PageHeader
        title="Thresholds & policy"
        subtitle="Acknowledgement SLAs, service standards per class, spare ratio and fare caps. Changes apply from the moment they are saved and never rewrite issued findings or published reports."
        meta={
          <>
            <Badge tone="brand" icon={Gauge}>
              Version {t.version}
            </Badge>
            <Badge tone="slate">Updated {dt(t.updatedAt)}</Badge>
          </>
        }
      />

      {!can.changeThreshold && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 mb-4">
          <p className="text-[12px] text-amber-900">
            You are signed in as a role that may view but not change thresholds. Switch to the national policy officer
            to amend them — and note that the officer who changes a threshold cannot issue findings based on it in the
            same period.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Acknowledgement SLAs" subtitle="How long an officer has to acknowledge an incident" />
          <CardBody className="space-y-2">
            {Object.entries(t.sla).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                <Badge tone={k === 'P1' ? 'red' : k === 'P2' ? 'amber' : 'blue'}>{k}</Badge>
                <span className="flex-1 text-[12.5px] text-ink-700">
                  {k === 'P1'
                    ? 'Life safety — SOS is always P1'
                    : k === 'P2'
                      ? 'Serious risk'
                      : k === 'P3'
                        ? 'Service quality'
                        : 'Informational'}
                </span>
                <span className="text-[13px] font-semibold text-ink-900 tabular-nums">
                  {v < 60 ? `${v} min` : v < 1440 ? `${v / 60} h` : `${v / 1440} days`}
                </span>
                <Button size="xs" onClick={() => open('sla', k, `SLA ${k}`, v)}>
                  Amend
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Service standards per class"
            subtitle="Headway, slack and on-time targets by service class"
          />
          <CardBody className="p-0">
            <DataTable
              search={false}
              dense
              columns={[
                { key: 'class', header: 'Class' },
                {
                  key: 'headwayMin',
                  header: 'Min headway',
                  render: (r) => (r.headwayMin ? `${r.headwayMin} min` : 'Timetabled'),
                },
                { key: 'slackPct', header: 'Slack', render: (r) => (r.slackPct != null ? `${r.slackPct}%` : '—') },
                { key: 'onTimePct', header: 'On-time target', render: (r) => `${r.onTimePct}%` },
                {
                  key: '_a',
                  header: '',
                  sortable: false,
                  align: 'right',
                  render: (r) => (
                    <Button
                      size="xs"
                      onClick={() => open('standard', r.class, `${r.class} slack`, r.slackPct ?? 0, 'slackPct')}
                    >
                      Amend slack
                    </Button>
                  ),
                },
              ]}
              rows={t.serviceStandards.map((s) => ({ ...s, id: s.class }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Fleet and disclosure" />
          <CardBody className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
              <span className="flex-1 text-[12.5px] text-ink-700">Spare ratio (holdings ÷ vehicles required)</span>
              <span className="text-[13px] font-semibold text-ink-900">{t.spareRatio}×</span>
              <Button size="xs" onClick={() => open('spare', null, 'Spare ratio', t.spareRatio)}>
                Amend
              </Button>
            </div>

            {[
              ['Full disclosure floor', `${t.coverageFloors.full}%`, 'At or above this, figures publish in full'],
              [
                'Indicative floor',
                `${t.coverageFloors.indicative}%`,
                'Between this and full, figures are labelled indicative',
              ],
              [
                'Prominent warning floor',
                `${t.coverageFloors.warning}%`,
                'Below this, a warning travels with every figure',
              ],
              ['Census floor', `${t.coverageFloors.censusFloor}%`, 'Below this, census dimensions are not measurable'],
              ['k-anonymity', `${t.kAnonymity} journeys`, 'No aggregate is produced for smaller groups'],
            ].map(([label, val, hint]) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5"
              >
                <div className="flex-1">
                  <p className="text-[12.5px] text-ink-700">{label}</p>
                  <p className="text-[11.5px] text-ink-400">{hint}</p>
                </div>
                <span className="text-[13px] font-semibold text-ink-900">{val}</span>
                <Badge tone="slate" icon={Lock}>
                  Locked
                </Badge>
              </div>
            ))}
            <p className="text-[11.5px] text-ink-400 pt-1 leading-relaxed">
              Coverage and disclosure floors are locked in the data layer. They change only through written policy plus
              a code release.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Fare bands"
            subtitle="Operators price inside the band — never below the floor, never above the ceiling. Bands are also managed in Central Admin → Fare bands."
          />
          <CardBody className="p-0 max-h-[340px] overflow-y-auto scroll-thin">
            <DataTable
              search={false}
              dense
              columns={[
                { key: 'line', header: 'Line' },
                { key: 'floor', header: 'Floor', align: 'right', render: (r) => MMK(r.floor) },
                { key: 'cap', header: 'Ceiling', align: 'right', render: (r) => MMK(r.cap) },
                { key: 'current', header: 'Selling now', align: 'right', render: (r) => MMK(r.current) },
                {
                  key: '_a',
                  header: '',
                  sortable: false,
                  align: 'right',
                  render: (r) => (
                    <div className="flex justify-end gap-1">
                      <Button size="xs" onClick={() => open('floor', r.route, `Fare floor ${r.line}`, r.floor)}>
                        Floor
                      </Button>
                      <Button size="xs" onClick={() => open('cap', r.route, `Fare ceiling ${r.line}`, r.cap)}>
                        Ceiling
                      </Button>
                    </div>
                  ),
                },
              ]}
              rows={db.fareCaps.map((c) => ({ ...c, id: c.route, line: routes.find((r) => r.id === c.route)?.line }))}
              pageSize={20}
            />
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Last change"
          subtitle={`Version ${t.version} · ${db.users.find((u) => u.id === t.updatedBy)?.name || t.updatedBy}`}
        />
        <CardBody>
          <p className="text-[12.5px] text-ink-800 leading-relaxed">“{t.reason}”</p>
          <p className="text-[11.5px] text-ink-400 mt-1.5">{dt(t.updatedAt)}</p>
        </CardBody>
      </Card>

      <ReasonDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        onConfirm={commit}
        title={`Amend — ${editing?.label || ''}`}
        confirmLabel="Save new value"
        variant="primary"
        subtitle="Changes take effect immediately and are never applied retroactively to findings or reports already issued."
        extra={
          <Field label="New value" required className="mb-4">
            <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
        }
      />
    </>
  )
}
