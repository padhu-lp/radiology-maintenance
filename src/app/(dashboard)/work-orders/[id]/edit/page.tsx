import { createServerClient } from '@/lib/supabase/server'
import { WorkOrderForm } from '@/components/work-orders/work-order-form'
import { redirect } from 'next/navigation'

// Next.js 16: params is a Promise and must be awaited.
export default async function EditWorkOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: workOrder, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('workorder_id', id)
    .single()

  if (error || !workOrder) {
    redirect('/work-orders')
  }

  const wo = workOrder as Record<string, any>

  // DATE columns come back as YYYY-MM-DD already; nulls become '' so the
  // controlled inputs stay controlled.
  const initialData = {
    workorder_id: wo.workorder_id,
    workorder_number: wo.workorder_number,
    equipment_id: wo.equipment_id ?? '',
    workorder_type: wo.workorder_type ?? 'Corrective',
    priority: wo.priority ?? 'Medium',
    problem_description: wo.problem_description ?? '',
    requested_by: wo.requested_by ?? '',
    fault_code: wo.fault_code ?? '',
    status: wo.status ?? 'Open',
    assigned_technician: wo.assigned_technician ?? '',
    service_provider: wo.service_provider ?? '',
    scheduled_date: wo.scheduled_date ?? '',
    start_date: wo.start_date ?? '',
    completion_date: wo.completion_date ?? '',
    downtime_hours: wo.downtime_hours ?? undefined,
    work_description: wo.work_description ?? '',
    resolution: wo.resolution ?? '',
    labor_hours: wo.labor_hours ?? undefined,
    labor_cost: wo.labor_cost ?? undefined,
    parts_cost: wo.parts_cost ?? undefined,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Work Order</h1>
        <p className="text-gray-600">
          {wo.workorder_number} &mdash; update progress, record work done, or close it out
        </p>
      </div>
      <WorkOrderForm initialData={initialData as any} mode="edit" />
    </div>
  )
}
