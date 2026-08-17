import { PageHeader } from '@/components/layout/page-header'
import { SupplierForm } from '@/components/suppliers/supplier-form'

export default function NewSupplierPage() {
  return (
    <>
      <PageHeader title="Add supplier" backHref="/suppliers" backLabel="Suppliers" />
      <SupplierForm />
    </>
  )
}
