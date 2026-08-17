import { PageHeader } from '@/components/layout/page-header'
import { WorkOrderForm } from '@/components/work-orders/work-order-form'

export default async function NewWorkOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ equipment?: string; request?: string }>
}) {
  // Populated when arriving from "Convert to work order" on a service request.
  const { equipment, request } = await searchParams

  return (
    <>
      <PageHeader
        title="Raise work order"
        description={request
          ? 'Converting a service request — the request will be marked Converted once this is saved.'
          : 'A work order number is assigned automatically on save.'}
        backHref={request ? `/service-requests/${request}` : '/work-orders'}
        backLabel={request ? 'Back to request' : 'Work Orders'}
      />
      <WorkOrderForm presetEquipmentId={equipment} serviceRequestId={request} />
    </>
  )
}
