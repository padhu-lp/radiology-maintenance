import { PageHeader } from '@/components/layout/page-header'
import { ServiceRequestForm } from '@/components/service-requests/service-request-form'

export default function NewServiceRequestPage() {
  return (
    <>
      <PageHeader
        title="Log service request"
        description="Capture the call now; identify the machine and raise a work order during triage."
        backHref="/service-requests"
        backLabel="Service Requests"
      />
      <ServiceRequestForm />
    </>
  )
}
