import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'

function statusVariant(status: string) {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Open': 'default',
    'In Progress': 'secondary',
    'On Hold': 'secondary',
    'Completed': 'outline',
    'Cancelled': 'destructive',
  }
  return map[status] || 'default'
}

function priorityVariant(priority: string) {
  const map: Record<string, 'default' | 'secondary' | 'destructive'> = {
    'Emergency': 'destructive',
    'High': 'destructive',
    'Medium': 'secondary',
    'Low': 'default',
  }
  return map[priority] || 'default'
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm">{value ?? <span className="text-gray-400">&mdash;</span>}</p>
    </div>
  )
}

function date(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : null
}

function money(value?: number | null) {
  return value === null || value === undefined ? null : Number(value).toFixed(2)
}

// Next.js 16: params is a Promise and must be awaited.
export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('work_orders')
    .select('*, inventory(equipment_name, inventory_number, serial_number, model_number)')
    .eq('workorder_id', id)
    .single()

  if (error || !data) {
    redirect('/work-orders')
  }

  const wo = data as Record<string, any>
  const equipment = wo.inventory as Record<string, any> | null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/work-orders"
            className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center mb-2"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to work orders
          </Link>
          <h1 className="text-3xl font-bold">{wo.workorder_number}</h1>
          <div className="flex gap-2 mt-2">
            <Badge variant={statusVariant(wo.status)}>{wo.status}</Badge>
            <Badge variant={priorityVariant(wo.priority)}>{wo.priority}</Badge>
            <Badge variant="outline">{wo.workorder_type}</Badge>
          </div>
        </div>
        <Link href={`/work-orders/${wo.workorder_id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <Field label="Name" value={equipment?.equipment_name} />
            <Field label="Inventory No." value={equipment?.inventory_number} />
            <Field label="Model" value={equipment?.model_number} />
            <Field label="Serial No." value={equipment?.serial_number} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-4 gap-6">
            <Field label="Requested By" value={wo.requested_by} />
            <Field label="Request Date" value={date(wo.request_date)} />
            <Field label="Fault Code" value={wo.fault_code} />
            <Field label="Scheduled" value={date(wo.scheduled_date)} />
          </div>
          <Field label="Problem Description" value={wo.problem_description} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignment &amp; Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-4 gap-6">
            <Field label="Assigned Technician" value={wo.assigned_technician} />
            <Field label="Service Provider" value={wo.service_provider} />
            <Field label="Start Date" value={date(wo.start_date)} />
            <Field label="Completion Date" value={date(wo.completion_date)} />
          </div>
          <div className="grid grid-cols-4 gap-6">
            <Field label="Downtime (hrs)" value={wo.downtime_hours} />
            <Field label="Labour Hours" value={wo.labor_hours} />
          </div>
          <Field label="Work Description" value={wo.work_description} />
          <Field label="Resolution" value={wo.resolution} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <Field label="Labour Cost" value={money(wo.labor_cost)} />
            <Field label="Parts Cost" value={money(wo.parts_cost)} />
            <Field label="Total Cost" value={money(wo.total_cost)} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
