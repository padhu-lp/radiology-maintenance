import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { RequestActions } from '@/components/service-requests/request-actions'
import { Pencil } from 'lucide-react'
import { DASH, dateTime, relative } from '@/lib/format'
import type { ServiceRequest } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm mt-0.5">{value || DASH}</div>
    </div>
  )
}

export default async function ServiceRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('service_requests')
    .select(`*,
      customers(customer_id, customer_name, customer_code, phone),
      equipment(equipment_id, equipment_name, equipment_code, equipment_type, status)`)
    .eq('request_id', id)
    .single()

  if (error || !data) redirect('/service-requests')

  const r = data as unknown as ServiceRequest & {
    customers: {
      customer_id: string; customer_name: string; customer_code: string; phone: string | null
    } | null
    equipment: {
      equipment_id: string; equipment_name: string
      equipment_code: string; equipment_type: string; status: string
    } | null
  }

  return (
    <>
      <PageHeader
        title={r.request_number}
        description={r.problem_summary}
        backHref="/service-requests"
        backLabel="Service Requests"
        actions={
          <Link href={`/service-requests/${id}/edit`}>
            <Button variant="outline"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <StatusBadge value={r.status} />
        <StatusBadge value={r.urgency} />
        <span className="text-xs text-muted-foreground self-center">
          received {relative(r.received_at)} · {r.channel}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Problem</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Summary" value={r.problem_summary} />
              <Field
                label="Details"
                value={r.problem_details
                  ? <p className="whitespace-pre-wrap">{r.problem_details}</p>
                  : null}
              />
              {r.triage_notes && (
                <Field
                  label="Findings & disposition"
                  value={<p className="whitespace-pre-wrap">{r.triage_notes}</p>}
                />
              )}
              {r.resolution_notes && (
                <Field
                  label="Resolution"
                  value={<p className="whitespace-pre-wrap">{r.resolution_notes}</p>}
                />
              )}
            </CardContent>
          </Card>

          <RequestActions
            requestId={id}
            requestNumber={r.request_number}
            status={r.status}
            triageNotes={r.triage_notes}
            equipmentId={r.equipment_id}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Customer"
                value={r.customers ? (
                  <Link href={`/customers/${r.customers.customer_id}`} className="hover:underline">
                    {r.customers.customer_name}
                  </Link>
                ) : null}
              />
              <Field label="Caller" value={r.reported_by_name} />
              <Field label="Caller phone" value={r.reported_by_phone ?? r.customers?.phone} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Equipment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {r.equipment ? (
                <>
                  <Field
                    label="Machine"
                    value={
                      <Link href={`/equipment/${r.equipment.equipment_id}`} className="hover:underline">
                        {r.equipment.equipment_name}
                      </Link>
                    }
                  />
                  <Field label="Code" value={r.equipment.equipment_code} />
                  <Field label="Type" value={r.equipment.equipment_type} />
                  <Field label="Status" value={<StatusBadge value={r.equipment.status} />} />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not identified. Edit the request to attach the machine once known.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Received" value={dateTime(r.received_at)} />
              <Field label="Closed" value={r.closed_at ? dateTime(r.closed_at) : null} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
