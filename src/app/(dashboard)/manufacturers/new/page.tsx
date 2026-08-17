import { PageHeader } from '@/components/layout/page-header'
import { ManufacturerForm } from '@/components/manufacturers/manufacturer-form'

export default function NewManufacturerPage() {
  return (
    <>
      <PageHeader
        title="New manufacturer"
        backHref="/manufacturers"
        backLabel="Manufacturers"
      />
      <ManufacturerForm />
    </>
  )
}
