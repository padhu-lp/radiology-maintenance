import { PageHeader } from '@/components/layout/page-header'
import { CustomerForm } from '@/components/customers/customer-form'

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader
        title="New customer"
        description="A customer code is assigned automatically on save."
        backHref="/customers"
        backLabel="Customers"
      />
      <CustomerForm />
    </>
  )
}
