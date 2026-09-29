import { useState } from 'react'
import { ArrowDown, ArrowUp, Eye, LayoutTemplate } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { Toggle } from '../../../components/ui/Field.jsx'
import { useToast } from '../../../components/ui/Toast.jsx'
import { useDb } from '../../../lib/store.jsx'
const DEFAULT_BLOCKS = [
  { id: 'search', label: 'Search bar', on: true, locked: true },
  { id: 'quick', label: 'Quick actions (Buy ticket · Bus stop · Routes · Ask YanGo)', on: true },
  { id: 'ticket', label: 'Active ticket card', on: true },
  { id: 'alerts', label: 'Service alert strip', on: true },
  { id: 'map', label: 'Live map', on: true },
  { id: 'arrivals', label: 'Arrivals at nearest stop', on: true },
  { id: 'wallet', label: 'Wallet & emergency shortcuts', on: true },
]
export default function HomeLayout() {
  const { db } = useDb()
  const toast = useToast()
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS)
  const move = (i, dir) =>
    setBlocks((b) => {
      const next = [...b]
      const j = i + dir
      if (j < 0 || j >= next.length) return b
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  const liveBanners = db.campaigns.filter(
    (c) => ['sponsored_result', 'eticket_footer'].includes(c.slot) && c.status === 'live',
  )
  return (
    <>
      <PageHeader
        title="Home layout & banners"
        subtitle="The order of the blocks on the Citizen App home screen. The search bar and the safety shortcuts cannot be removed, and the home screen carries no advertising."
        actions={
          <Button
            variant="primary"
            icon={Eye}
            onClick={() =>
              toast({ title: 'Layout published', body: 'The Citizen App home screen updates on next launch.' })
            }
          >
            Publish layout
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Home screen blocks"
            icon={LayoutTemplate}
            subtitle="Drag order with the arrows; toggle a block off to hide it"
          />
          <CardBody className="p-0">
            <div className="divide-y divide-ink-100">
              {blocks.map((b, i) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-6 text-[12px] text-ink-400 tabular-nums">{i + 1}</span>
                  <span className="flex-1 text-[12.5px] text-ink-800">{b.label}</span>
                  {b.locked && <Badge tone="slate">Required</Badge>}
                  <div className="flex gap-1">
                    <Button size="xs" icon={ArrowUp} disabled={i === 0} onClick={() => move(i, -1)} />
                    <Button size="xs" icon={ArrowDown} disabled={i === blocks.length - 1} onClick={() => move(i, 1)} />
                  </div>
                  <div className="w-12 flex justify-end">
                    <Toggle
                      checked={b.on}
                      onChange={(v) =>
                        !b.locked && setBlocks((cur) => cur.map((x) => (x.id === b.id ? { ...x, on: v } : x)))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="In-app ad slots"
              subtitle="Journey results and the e-ticket only — the home screen carries no advertising"
            />
            <CardBody className="space-y-2">
              {liveBanners.map((c) => (
                <div key={c.id} className="rounded-lg border border-ink-200 p-3">
                  <Badge tone="slate">Sponsored</Badge>
                  <p className="text-[12.5px] font-medium text-ink-900 mt-1.5">{c.advertiser}</p>
                  <p className="text-[11.5px] text-ink-400">{c.slot.replace(/_/g, ' ')} · image 3:1 + deep link</p>
                </div>
              ))}
              {liveBanners.length === 0 && <p className="text-[12px] text-ink-400">No live banner campaigns.</p>}
              <p className="text-[11.5px] text-ink-400 pt-1 leading-relaxed">
                Public service announcements always take the first slot and are free. The home screen is kept clear so
                the map, arrivals and safety shortcuts are never pushed down the page.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Preview" subtitle="Order as the passenger will see it" />
            <CardBody>
              <div className="rounded-xl border border-ink-200 overflow-hidden">
                {blocks
                  .filter((b) => b.on)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="px-3 py-2.5 border-b border-ink-50 last:border-0 text-[12.5px] text-ink-600"
                    >
                      {b.label}
                    </div>
                  ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
