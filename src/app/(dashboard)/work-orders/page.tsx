import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader, EmptyState } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { DASH, date, money } from '@/lib/format'
import { WORKORDER_STATUSES, PRIORITIES, WORKORDER_TYPES, isOneOf } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

type Row = {
  workorder_id: string; workorder_number: string; workorder_type: string
  priority: string; status: string; scheduled_date: string | null
  completion_date: string | null; total_cost: number | null
  equipment: {
    equipment_name: string; equipment_code: string
    customers: { customer_name: string } | null
  } | null
  workorder_technicians: { technicians: { first_name: string; last_name: string } | null }[]
}

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; type?: string }>
}) {
  const { status, priority, type } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .from('work_orders')
    .select(`workorder_id, workorder_number, workorder_type, priority, status,
             scheduled_date, completion_date, total_cost,
             equipment(equipment_name, equipment_code, customers(customer_name)),
             workorder_technicians(technicians(first_name, last_name))`)
    .order('created_at', { ascending: false })

  if (isOneOf(WORKORDER_STATUSES, status)) query = query.eq('status', status)
  if (isOneOf(PRIORITIES, priority)) query = query.eq('priority', priority)
  if (isOneOf(WORKORDER_TYPES, type)) query = query.eq('workorder_type', type)

  const { data, error } = await query
  const rows = (data ?? []) as unknown as Row[]

  const href = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ status, priority, type, ...next })) if (v) p.set(k, v)
    const qs = p.toString()
    return qs ? `/work-orders?${qs}` : '/work-orders'
  }

  const chip = (label: string, to: string, active: boolean) => (
    <Link key={to + label} href={to}
      className={`rounded-md px-2.5 py-1 text-xs ring-1 ring-inset transition-colors ${
        active ? 'bg-slate-900 text-white ring-slate-900'
               : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}`}>
      {label}
    </Link>
  )

  const filtered = Boolean(status || priority || type)

  return (
    <>
      <PageHeader
        title="Work Orders"
        description="Scheduled and reactive service jobs"
        actions={
          <Link href="/work-orders/new">
            <Button><Plus className="mr-2 h-4 w-4" />Raise work order</Button>
          </Link>
        }
      />

      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1 w-14">Status</span>
          {chip('All', href({ status: undefined }), !status)}
          {WORKORDER_STATUSES.map((s) => chip(s, href({ status: s }), status === s))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1 w-14">Priority</span>
          {chip('All', href({ priority: undefined }), !priority)}
          {PRIORITIES.map((p) => chip(p, href({ priority: p }), priority === p))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1 w-14">Type</span>
          {chip('All', href({ type: undefined }), !type)}
          {WORKORDER_TYPES.map((t) => chip(t, href({ type: t }), type === t))}
        </div>
      </div>

      <Card>
        {error ? (
          <EmptyState title="Could not load work orders" description={error.message} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={filtered ? 'Nothing matches these filters' : 'No work orders yet'}
            description={
              filtered
                ? 'Try clearing the filters above.'
                : 'Raise one directly, or convert a triaged service request.'
            }
            action={
              filtered
                ? <Link href="/work-orders"><Button variant="outline">Clear filters</Button></Link>
                : <Link href="/work-orders/new"><Button>Raise work order</Button></Link>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((w) => {
                const techs = w.workorder_technicians
                  ?.map((t) => t.technicians ? `${t.technicians.first_name} ${t.technicians.last_name}` : null)
                  .filter(Boolean) as string[]

                return (
                  <TableRow key={w.workorder_id}>
                    <TableCell className="font-mono text-xs">
                      <Link href={`/work-orders/${w.workorder_id}`} className="hover:underline">
                        {w.workorder_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/work-orders/${w.workorder_id}`} className="hover:underline font-medium">
                        {w.equipment?.equipment_name ?? DASH}
                      </Link>
                      {w.equipment?.customers?.customer_name && (
                        <span className="block text-xs text-muted-foreground">
                          {w.equipment.customers.customer_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{w.workorder_type}</TableCell>
                    <TableCell className="text-sm">
                      {techs?.length ? techs.join(', ')
                        : <span className="text-xs text-muted-foreground italic">unassigned</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{date(w.scheduled_date)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(w.total_cost)}</TableCell>
                    <TableCell><StatusBadge value={w.priority} /></TableCell>
                    <TableCell><StatusBadge value={w.status} /></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  )
}
