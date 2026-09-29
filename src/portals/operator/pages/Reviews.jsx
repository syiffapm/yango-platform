import { useState } from 'react'
import { MessageSquare, Star } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx'
import Button from '../../../components/ui/Button.jsx'
import Badge from '../../../components/ui/Badge.jsx'
import Stat, { StatGrid } from '../../../components/ui/Stat.jsx'
import Empty from '../../../components/ui/Empty.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { Field, Textarea } from '../../../components/ui/Field.jsx'
import { BarsChart } from '../../../components/domain/Charts.jsx'
import useOperator from '../useOperator.js'
import { useToast } from '../../../components/ui/Toast.jsx'
import { relative } from '../../../lib/format.js'
import { routes } from '../../../data/geo.js'
export default function Reviews() {
  const { reviews, drivers, update } = useOperator()
  const toast = useToast()
  const [replying, setReplying] = useState(null)
  const [text, setText] = useState('')
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const dist = [5, 4, 3, 2, 1].map((n) => ({ name: `${n} ★`, value: reviews.filter((r) => r.rating === n).length }))
  const reply = () => {
    update((d) => {
      const r = d.reviews.find((x) => x.id === replying.id)
      r.reply = { at: new Date().toISOString(), text }
    })
    toast({ title: 'Reply published', body: 'Replies are moderated before they appear to passengers.' })
    setReplying(null)
    setText('')
  }
  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle="Passenger ratings per trip, driver and vehicle, with moderated replies. Ratings feed the public satisfaction KPI."
      />

      <StatGrid cols={4} className="mb-5">
        <Stat
          label="Average rating"
          value={avg ? avg.toFixed(1) : '—'}
          unit="/ 5"
          icon={Star}
          tone={avg >= 4 ? 'good' : 'warn'}
          method="Mean of all passenger trip ratings for your services. Target is ≥ 4.0."
        />
        <Stat label="Reviews" value={reviews.length} method="Rated trips in the current register." />
        <Stat
          label="Replies published"
          value={reviews.filter((r) => r.reply).length}
          method="Operator replies that passed moderation."
        />
        <Stat
          label="Below 3 ★"
          value={reviews.filter((r) => r.rating < 3).length}
          tone={reviews.some((r) => r.rating < 3) ? 'warn' : 'good'}
          method="Low ratings worth a reply or an operational follow-up."
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Rating distribution" />
          <CardBody>
            <BarsChart
              data={dist}
              x="name"
              layout="vertical"
              height={180}
              series={[{ key: 'value', label: 'Reviews' }]}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent reviews" icon={MessageSquare} />
          <CardBody className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-ink-200 p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] text-amber-500">
                    {'★'.repeat(r.rating)}
                    <span className="text-ink-200">{'★'.repeat(5 - r.rating)}</span>
                  </span>
                  <Badge tone="slate">{routes.find((x) => x.id === r.route)?.line}</Badge>
                  <Badge tone="slate">{drivers.find((d) => d.id === r.driver)?.name || 'Driver'}</Badge>
                  <span className="text-[11.5px] text-ink-400 ml-auto">{relative(r.at)}</span>
                </div>
                <p className="text-[12.5px] text-ink-700 mt-2 leading-relaxed">{r.text}</p>
                {r.reply ? (
                  <div className="mt-2 rounded-lg bg-brand-50 border border-brand-100 p-2.5">
                    <p className="text-[11.5px] uppercase tracking-wider text-brand-700 mb-0.5">Your reply</p>
                    <p className="text-[12px] text-brand-900">{r.reply.text}</p>
                  </div>
                ) : (
                  <Button size="xs" className="mt-2" onClick={() => setReplying(r)}>
                    Reply
                  </Button>
                )}
              </div>
            ))}
            {reviews.length === 0 && <Empty compact title="No reviews yet" />}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={!!replying}
        onClose={() => setReplying(null)}
        title="Reply to a passenger"
        subtitle="Replies are moderated. Never include personal details about the passenger."
        footer={
          <>
            <Button onClick={() => setReplying(null)}>Cancel</Button>
            <Button variant="primary" disabled={!text} onClick={reply}>
              Publish reply
            </Button>
          </>
        }
      >
        <Field label="Reply" required>
          <Textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Thank you for the feedback — here is what we have changed…"
          />
        </Field>
      </Modal>
    </>
  )
}
