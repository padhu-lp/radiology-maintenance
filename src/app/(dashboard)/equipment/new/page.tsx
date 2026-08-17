import { PageHeader } from '@/components/layout/page-header'
import { EquipmentForm } from '@/components/equipment/equipment-form'

export default function NewEquipmentPage() {
  return (
    <>
      <PageHeader
        title="Register equipment"
        description="An equipment code is assigned automatically on save."
        backHref="/equipment"
        backLabel="Equipment"
      />
      <EquipmentForm />
    </>
  )
}
