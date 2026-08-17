import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { TechnicianAssignments, type Assignment } from '@/components/work-orders/technician-assignments'
import { Pencil } from 'lucide-react'
import { DASH, date, money, relative } from '@/lib/format'
import type { WorkOrder } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm mt-0.5">{value || DASH}</div>
    </div>
  )
}

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('work_orders')
    .select(`*,
      equipment(equipment_id, equipment_name, equipment_code, equipment_type, status,
                customers(customer_id, customer_name),
                locations(department_name)),
      service_requests(request_id, request_number, problem_summary),
      workorder_technicians(assignment_id, technician_id, role, hours_worked, notes,
        technicians(first_name, last_name, technician_code, specialization))`)
    .eq('workorder_id', id)
    .single()

  if (error || !data) redirect('/work-orders')

  const w = data as unknown as WorkOrder & {
    equipment: {
      equipment_id: string; equipment_name: string; equipment_code: string
      equipment_type: string; status: string
      customers: { customer_id: string; customer_name: string } | null
      locations: { department_name: string } | null
    } | null
    service_requests: {
      request_id: string; request_number: string; problem_summary: string
    } | null
    workorder_technicians: Assignment[]
  }

  const locked = w.status === 'Completed' || w.status === 'Cancelled'

  return (
    <>
      <PageHeader
        title={w.workorder_number}
        description={w.equipment
          ? `${w.equipment.equipment_name} · ${w.equipment.customers?.customer_name ?? ''}`
          : undefined}
        backHref="/work-orders"
        backLabel="Work Orders"
        actions={
          <Link href={`/work-orders/${id}/edit`}>
            <Button variant="outline"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <StatusBadge value={w.status} />
        <StatusBadge value={w.priority} />
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {w.workorder_type}
        </span>
        <span className="text-xs text-muted-foreground">raised {relative(w.created_at)}</span>
      </div>

      {w.service_requests && (
        <Card className="mb-6 border-violet-200 bg-violet-50/40">
          <CardContent className="py-3 text-sm">
            Raised from service request{' '}
            <Link href={`/service-requests/${w.service_requests.request_id}`}
              className="font-medium hover:underline">
              {w.service_requests.request_number}
            </Link>
            <span className="text-muted-foreground"> — {w.service_requests.problem_summary}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Problem &amp; work</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Fault code" value={w.fault_code} />
              <Field label="Problem" value={w.problem_description
                ? <p className="whitespace-pre-wrap">{w.problem_description}</p> : null} />
              <Field label="Work performed" value={w.work_description
                ? <p className="whitespace-pre-wrap">{w.work_description}</p> : null} />
              <Field label="Resolution" value={w.resolution
                ? <p className="whitespace-pre-wrap">{w.resolution}</p> : null} />
            </CardContent>
          </Card>

          <TechnicianAssignments
            workOrderId={id}
            assignments={w.workorder_technicians ?? []}
            locked={locked}
          />

          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Parts used appear here once the parts catalogue is built. Recording a part
              will decrement stock and update the cost below automatically.
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Equipment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {w.equipment ? (
                <>
                  <Field label="Machine" value={
                    <Link href={`/equipment/${w.equipment.equipment_id}`} className="hover:underline">
                      {w.equipment.equipment_name}
                    </Link>
                  } />
                  <Field label="Code" value={w.equipment.equipment_code} />
                  <Field label="Type" value={w.equipment.equipment_type} />
                  <Field label="Customer" value={
                    w.equipment.customers ? (
                      <Link href={`/customers/${w.equipment.customers.customer_id}`} className="hover:underline">
                        {w.equipment.customers.customer_name}
                      </Link>
                    ) : null
                  } />
                  <Field label="Site" value={w.equipment.locations?.department_name} />
                </>
              ) : <p className="text-sm text-muted-foreground">Equipment record missing.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Dates</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Scheduled" value={date(w.scheduled_date)} />
              <Field label="Started" value={date(w.start_date)} />
              <Field label="Completed" value={date(w.completion_date)} />
              <Field label="Downtime" value={
                w.downtime_hours === null ? null : `${Number(w.downtime_hours).toFixed(2)} h`
              } />
              <Field label="External provider" value={w.service_provider} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Costs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Labour</span>
                <span className="tabular-nums">{money(w.labor_cost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Parts</span>
                <span className="tabular-nums">{money(w.parts_cost)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-3">
                <span>Total</span>
                <span className="tabular-nums">{money(w.total_cost)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
