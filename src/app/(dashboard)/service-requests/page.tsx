import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader, EmptyState } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { DASH, dateTime } from '@/lib/format'
import { REQUEST_STATUSES, URGENCIES, isOneOf } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

type Row = {
  request_id: string; request_number: string; problem_summary: string
  urgency: string; status: string; channel: string; received_at: string
  customers: { customer_name: string } | null
  equipment: { equipment_name: string; equipment_code: string } | null
}

export default async function ServiceRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; urgency?: string }>
}) {
  const { status, urgency } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .from('service_requests')
    .select(`request_id, request_number, problem_summary, urgency, status, channel, received_at,
             customers(customer_name), equipment(equipment_name, equipment_code)`)
    .order('received_at', { ascending: false })

  if (isOneOf(REQUEST_STATUSES, status)) query = query.eq('status', status)
  if (isOneOf(URGENCIES, urgency)) query = query.eq('urgency', urgency)

  const { data, error } = await query
  const rows = (data ?? []) as unknown as Row[]

  const href = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ status, urgency, ...next })) if (v) p.set(k, v)
    const qs = p.toString()
    return qs ? `/service-requests?${qs}` : '/service-requests'
  }

  const chip = (label: string, to: string, active: boolean) => (
    <Link
      key={to + label}
      href={to}
      className={`rounded-md px-2.5 py-1 text-xs ring-1 ring-inset transition-colors ${
        active ? 'bg-slate-900 text-white ring-slate-900'
              : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <>
      <PageHeader
        title="Service Requests"
        description="Calls and messages from customers, before they become work orders"
        actions={
          <Link href="/service-requests/new">
            <Button><Plus className="mr-2 h-4 w-4" />Log request</Button>
          </Link>
        }
      />

      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1 w-14">Status</span>
          {chip('All', href({ status: undefined }), !status)}
          {REQUEST_STATUSES.map((s) => chip(s, href({ status: s }), status === s))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1 w-14">Urgency</span>
          {chip('All', href({ urgency: undefined }), !urgency)}
          {URGENCIES.map((u) => chip(u, href({ urgency: u }), urgency === u))}
        </div>
      </div>

      <Card>
        {error ? (
          <EmptyState title="Could not load requests" description={error.message} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={status || urgency ? 'Nothing matches these filters' : 'No service requests yet'}
            description={
              status || urgency
                ? 'Try clearing the filters above.'
                : 'Log the first call from a customer. Requests become work orders once triaged.'
            }
            action={
              status || urgency
                ? <Link href="/service-requests"><Button variant="outline">Clear filters</Button></Link>
                : <Link href="/service-requests/new"><Button>Log request</Button></Link>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.request_id}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/service-requests/${r.request_id}`} className="hover:underline">
                      {r.request_number}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {dateTime(r.received_at)}
                    <span className="block text-xs">{r.channel}</span>
                  </TableCell>
                  <TableCell>{r.customers?.customer_name ?? DASH}</TableCell>
                  <TableCell>
                    {r.equipment
                      ? <span className="text-sm">{r.equipment.equipment_name}</span>
                      : <span className="text-xs text-muted-foreground italic">not identified</span>}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <Link href={`/service-requests/${r.request_id}`} className="hover:underline line-clamp-2">
                      {r.problem_summary}
                    </Link>
                  </TableCell>
                  <TableCell><StatusBadge value={r.urgency} /></TableCell>
                  <TableCell><StatusBadge value={r.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  )
}
