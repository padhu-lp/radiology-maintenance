import { WorkOrderForm } from '@/components/work-orders/work-order-form'

export default function NewWorkOrderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Work Order</h1>
        <p className="text-gray-600">Create a new maintenance or repair work order</p>
      </div>

      <div className="max-w-2xl">
        <WorkOrderForm />
      </div>
    </div>
  )
}
