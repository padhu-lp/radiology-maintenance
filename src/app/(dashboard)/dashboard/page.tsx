import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

async function countOf(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  table: 'customers' | 'equipment' | 'service_requests' | 'work_orders',
  filter?: (q: never) => never
) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filter) q = filter(q as never)
  const { count } = await q
  return count ?? 0
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-slate-300">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tabular-nums mt-1">{value}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const [customers, equipment, openRequests, openWorkOrders] = await Promise.all([
    countOf(supabase, 'customers'),
    countOf(supabase, 'equipment'),
    supabase.from('service_requests').select('*', { count: 'exact', head: true })
      .in('status', ['New', 'Triaged']).then((r) => r.count ?? 0),
    supabase.from('work_orders').select('*', { count: 'exact', head: true })
      .in('status', ['Open', 'In Progress', 'On Hold']).then((r) => r.count ?? 0),
  ])

  return (
    <>
      <PageHeader title="Overview" description="Current service position" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open service requests" value={openRequests}   href="/service-requests" />
        <Stat label="Open work orders"      value={openWorkOrders} href="/work-orders" />
        <Stat label="Equipment"             value={equipment}      href="/equipment" />
        <Stat label="Customers"             value={customers}      href="/customers" />
      </div>

      <Card className="mt-6">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Charts and activity feed arrive once service requests and work orders are rebuilt.
        </CardContent>
      </Card>
    </>
  )
}
