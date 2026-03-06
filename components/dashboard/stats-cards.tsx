import { formatCurrency } from '@/lib/utils'
import { DollarSign, CheckCircle, Clock, Pencil } from 'lucide-react'
import type { DashboardStats } from '@/types'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  colour: 'primary' | 'success' | 'destructive' | 'warning'
  icon: React.ReactNode
}

function StatCard({ label, value, sub, colour, icon }: StatCardProps) {
  const colours = {
    primary:     { bg: 'bg-primary/8',     text: 'text-primary',     icon: 'bg-primary/15'     },
    success:     { bg: 'bg-success/8',      text: 'text-success',     icon: 'bg-success/15'     },
    destructive: { bg: 'bg-destructive/8',  text: 'text-destructive', icon: 'bg-destructive/15' },
    warning:     { bg: 'bg-warning/8',      text: 'text-warning',     icon: 'bg-warning/15'     },
  }
  const c = colours[colour]

  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`flex-none p-3 rounded-xl ${c.icon}`}>
        <span className={c.text}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <p className={`text-2xl font-bold ${c.text} mt-0.5 font-mono`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Outstanding"
        value={formatCurrency(stats.total_outstanding)}
        sub="Unpaid invoices"
        colour="primary"
        icon={<DollarSign className="w-6 h-6" />}
      />
      <StatCard
        label="Paid This Month"
        value={formatCurrency(stats.total_paid_this_month)}
        colour="success"
        icon={<CheckCircle className="w-6 h-6" />}
      />
      <StatCard
        label="Overdue"
        value={String(stats.overdue_count)}
        sub={stats.overdue_count === 1 ? 'invoice' : 'invoices'}
        colour="destructive"
        icon={<Clock className="w-6 h-6" />}
      />
      <StatCard
        label="Pending Approval"
        value={String(stats.quotes_awaiting_approval)}
        sub="Quotes / amendments"
        colour="warning"
        icon={<Pencil className="w-6 h-6" />}
      />
    </div>
  )
}
