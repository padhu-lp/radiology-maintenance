import { PageHeader } from '@/components/layout/page-header'
import { PartForm } from '@/components/parts/part-form'

export default function NewPartPage() {
  return (
    <>
      <PageHeader
        title="Add part"
        description="A catalogue code is assigned automatically on save."
        backHref="/parts"
        backLabel="Parts"
      />
      <PartForm />
    </>
  )
}
