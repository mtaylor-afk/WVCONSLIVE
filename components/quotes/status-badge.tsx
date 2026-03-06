import { Badge } from '@/components/ui/badge'
import { STATUS_COLOURS, STATUS_LABELS, AMENDMENT_STATUS_COLOURS } from '@/lib/utils'
import type { QuoteStatus, AmendmentStatus } from '@/types'

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <Badge className={STATUS_COLOURS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

export function AmendmentStatusBadge({ status }: { status: AmendmentStatus }) {
  const labels: Record<AmendmentStatus, string> = {
    pending: 'Awaiting Approval',
    approved: 'Approved',
    rejected: 'Rejected',
  }
  return (
    <Badge className={AMENDMENT_STATUS_COLOURS[status]}>
      {labels[status]}
    </Badge>
  )
}
