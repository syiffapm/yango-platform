import { FileText, Upload } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PortalShell.jsx'
import DataTable from '../../../components/ui/Table.jsx'
import { StatusPill } from '../../../components/ui/Badge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { useDb } from '../../../lib/store.jsx'
import { useSession } from '../../../lib/session.jsx'
import { dateOnly, relative } from '../../../lib/format.js'
export default function DocumentVault() {
  const { db } = useDb()
  const [ses] = useSession('licensing')
  const rows = db.applications
    .filter((a) => a.operator === ses.operator)
    .flatMap((a) =>
      a.documents.map((d) => ({
        id: `${a.id}-${d.name}`,
        name: d.name,
        application: a.id,
        type: a.typeLabel,
        status: d.status,
        uploadedAt: d.uploadedAt,
        expiry: d.ocr?.expiry,
        size: d.size,
      })),
    )
  return (
    <>
      <PageHeader
        title="Document vault"
        subtitle="One copy of every document, virus-scanned and OCR-read. Expiry dates are extracted automatically and reused across applications so nothing is uploaded twice."
        actions={
          <Button variant="primary" icon={Upload}>
            Upload document
          </Button>
        }
      />
      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Document',
            render: (r) => (
              <span className="inline-flex items-center gap-2">
                <FileText size={14} className="text-ink-400" />
                {r.name}
              </span>
            ),
          },
          { key: 'type', header: 'Used for' },
          { key: 'application', header: 'Application' },
          { key: 'expiry', header: 'OCR expiry', render: (r) => dateOnly(r.expiry) },
          { key: 'size', header: 'Size' },
          { key: 'uploadedAt', header: 'Uploaded', render: (r) => relative(r.uploadedAt) },
          { key: 'status', header: 'Scan', render: (r) => <StatusPill status={r.status} /> },
        ]}
        rows={rows}
        exportName="document-vault"
        empty="No documents uploaded yet"
      />
    </>
  )
}
