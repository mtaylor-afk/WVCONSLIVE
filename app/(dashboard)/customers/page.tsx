import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import type { Customer } from '@/types'

export default async function CustomersPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('customers')
    .select('*')
    .order('name')

  const customers = (data ?? []) as Customer[]

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <Link
          href="/customers/new"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-lg transition-all shadow-sm min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Customer</span>
        </Link>
      </div>

      <div className="card p-0 overflow-hidden">
        {customers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 text-border" strokeWidth={1.5} />
            <p className="text-sm">No customers yet</p>
            <Link href="/customers/new" className="text-sm text-primary hover:text-primary/80 mt-1 inline-block font-medium">
              {'Add your first customer ->'}
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border bg-secondary">
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Phone</th>
                    <th className="px-6 py-3 font-medium">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/quotes?customer=${c.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                          {c.name}
                        </Link>
                        {c.address && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{c.address}</p>}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{c.email}</td>
                      <td className="px-6 py-4 text-muted-foreground">{c.phone ?? '\u2014'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="lg:hidden divide-y divide-border/50">
              {customers.map(c => (
                <Link
                  key={c.id}
                  href={`/quotes?customer=${c.id}`}
                  className="flex items-center justify-between p-4 min-h-[60px] active:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>
                  <div className="text-right flex-none pl-3">
                    <p className="text-xs text-muted-foreground">{c.phone ?? '\u2014'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
