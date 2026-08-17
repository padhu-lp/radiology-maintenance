import { PageHeader } from '@/components/layout/page-header'
import { TechnicianForm } from '@/components/technicians/technician-form'

export default function NewTechnicianPage() {
  return (
    <>
      <PageHeader
        title="Add technician"
        description="A technician code is assigned automatically on save."
        backHref="/technicians"
        backLabel="Technicians"
      />
      <TechnicianForm />
    </>
  )
}
