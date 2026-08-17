import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { WorkOrderForm } from '@/components/work-orders/work-order-form'
import type { WorkOrder } from '@/lib/types/database'

export default async function EditWorkOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('work_orders').select('*').eq('workorder_id', id).single()

  if (error || !data) redirect('/work-orders')
  const w = data as WorkOrder

  return (
    <>
      <PageHeader
        title={`Edit ${w.workorder_number}`}
        description="Update progress, record what was done, or close it out."
        backHref={`/work-orders/${id}`}
        backLabel="Back to work order"
      />
      <WorkOrderForm workOrder={w} />
    </>
  )
}
