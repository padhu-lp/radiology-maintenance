import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { ServiceRequestForm } from '@/components/service-requests/service-request-form'
import type { ServiceRequest } from '@/lib/types/database'

export default async function EditServiceRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('service_requests').select('*').eq('request_id', id).single()

  if (error || !data) redirect('/service-requests')
  const r = data as ServiceRequest

  return (
    <>
      <PageHeader
        title={`Edit ${r.request_number}`}
        description={r.problem_summary}
        backHref={`/service-requests/${id}`}
        backLabel="Back to request"
      />
      <ServiceRequestForm request={r} />
    </>
  )
}
