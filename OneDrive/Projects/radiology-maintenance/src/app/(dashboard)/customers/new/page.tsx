import { CustomerForm } from '@/components/customers/customer-form'

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Customer</h1>
        <p className="text-gray-600">Create a new customer organization</p>
      </div>

      <CustomerForm mode="create" />
    </div>
  )
}
