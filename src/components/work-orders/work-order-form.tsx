'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { describeDbError, nullBlanks } from '@/lib/errors'
import { money } from '@/lib/format'
import {
  WORKORDER_TYPES, PRIORITIES, WORKORDER_STATUSES,
  type WorkOrder, type WorkOrderInsert,
} from '@/lib/types/database'

const optionalNumber = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce.number().min(0).optional()
)

const schema = z.object({
  equipment_id: z.string().uuid('Select the equipment this work is for'),
  workorder_type: z.enum(WORKORDER_TYPES, { message: 'Select a work order type' }),
  priority: z.enum(PRIORITIES).default('Medium'),
  status: z.enum(WORKORDER_STATUSES).default('Open'),
  problem_description: z.string().optional().or(z.literal('')),
  fault_code: z.string().max(50).optional().or(z.literal('')),
  scheduled_date: z.string().optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  completion_date: z.string().optional().or(z.literal('')),
  downtime_hours: optionalNumber,
  work_description: z.string().optional().or(z.literal('')),
  resolution: z.string().optional().or(z.literal('')),
  service_provider: z.string().max(255).optional().or(z.literal('')),
  labor_cost: optionalNumber,
}).superRefine((d, ctx) => {
  // Mirrors the work_orders_completion_documented CHECK constraint. Catching it
  // here gives a field-level message instead of a database error toast.
  if (d.status === 'Completed') {
    if (!d.resolution || d.resolution.trim().length < 10) {
      ctx.addIssue({
        code: 'custom', path: ['resolution'],
        message: 'A resolution of at least 10 characters is required to complete a work order',
      })
    }
    if (!d.completion_date) {
      ctx.addIssue({
        code: 'custom', path: ['completion_date'],
        message: 'Completion date is required to complete a work order',
      })
    }
  }
  if (d.completion_date && d.start_date && d.completion_date < d.start_date) {
    ctx.addIssue({
      code: 'custom', path: ['completion_date'],
      message: 'Completion cannot be before the start date',
    })
  }
})

type FormData = z.infer<typeof schema>
type EquipOption = { id: string; label: string; customer: string }

export function WorkOrderForm({
  workOrder,
  presetEquipmentId,
  serviceRequestId,
}: {
  workOrder?: WorkOrder
  presetEquipmentId?: string
  serviceRequestId?: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [equipment, setEquipment] = useState<EquipOption[]>([])
  const isEdit = Boolean(workOrder)

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema) as never,
      defaultValues: {
        equipment_id: workOrder?.equipment_id ?? presetEquipmentId ?? '',
        workorder_type: workOrder?.workorder_type ?? undefined,
        priority: workOrder?.priority ?? 'Medium',
        status: workOrder?.status ?? 'Open',
        problem_description: workOrder?.problem_description ?? '',
        fault_code: workOrder?.fault_code ?? '',
        scheduled_date: workOrder?.scheduled_date ?? '',
        start_date: workOrder?.start_date ?? '',
        completion_date: workOrder?.completion_date ?? '',
        downtime_hours: workOrder?.downtime_hours ?? undefined,
        work_description: workOrder?.work_description ?? '',
        resolution: workOrder?.resolution ?? '',
        service_provider: workOrder?.service_provider ?? '',
        labor_cost: workOrder?.labor_cost ?? undefined,
      },
    })

  const status = watch('status')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('equipment')
        .select('equipment_id, equipment_name, equipment_code, equipment_type, customers(customer_name)')
        .order('equipment_name')

      setEquipment((data ?? []).map((e) => {
        const row = e as unknown as {
          equipment_id: string; equipment_name: string; equipment_code: string
          equipment_type: string; customers: { customer_name: string } | null
        }
        return {
          id: row.equipment_id,
          label: `${row.equipment_name} · ${row.equipment_type} (${row.equipment_code})`,
          customer: row.customers?.customer_name ?? '',
        }
      }))
    }
    load()
  }, [supabase])

  // Completing usually happens today; fill the date so it isn't a chore.
  useEffect(() => {
    if (status === 'Completed' && !watch('completion_date')) {
      setValue('completion_date', new Date().toISOString().slice(0, 10))
    }
  }, [status, setValue, watch])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload = nullBlanks(data) as unknown as WorkOrderInsert

      if (isEdit && workOrder) {
        const { error } = await supabase
          .from('work_orders').update(payload).eq('workorder_id', workOrder.workorder_id)
        if (error) throw error
        toast({ title: 'Saved', description: `${workOrder.workorder_number} updated` })
        router.push(`/work-orders/${workOrder.workorder_id}`)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const { data: created, error } = await supabase
          .from('work_orders')
          .insert({
            ...payload,
            created_by: user?.id ?? null,
            service_request_id: serviceRequestId ?? null,
          } as WorkOrderInsert)
          .select('workorder_id, workorder_number')
          .single()
        if (error) throw error
        if (!created) throw new Error('Work order created but could not be read back')

        // Close the loop on the originating request. Done after the work order
        // exists, so a failure here leaves the request open rather than marking
        // it converted with nothing to show for it.
        if (serviceRequestId) {
          const { error: srError } = await supabase
            .from('service_requests')
            .update({ status: 'Converted' } as never)
            .eq('request_id', serviceRequestId)

          if (srError) {
            toast({
              title: 'Work order raised, request not updated',
              description: `${created.workorder_number} was created, but the service request could not be marked Converted. Update it manually.`,
              variant: 'destructive',
            })
            router.push(`/work-orders/${created.workorder_id}`)
            router.refresh()
            return
          }
        }

        toast({
          title: 'Work order raised',
          description: serviceRequestId
            ? `${created.workorder_number} — request marked Converted`
            : created.workorder_number,
        })
        router.push(`/work-orders/${created.workorder_id}`)
      }
      router.refresh()
    } catch (err) {
      const { title, description } = describeDbError(err)
      toast({ title, description, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const enumSelect = (
    name: 'workorder_type' | 'priority' | 'status',
    label: string,
    values: readonly string[],
    required = false
  ) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}{required && ' *'}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select value={field.value || ''} onValueChange={field.onChange}>
            <SelectTrigger id={name}><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
            <SelectContent>
              {values.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      />
      {errors[name] && <p className="text-sm text-red-600">{errors[name]?.message as string}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">What and where</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="equipment_id">Equipment *</Label>
            <Controller
              name="equipment_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange} disabled={isEdit}>
                  <SelectTrigger id="equipment_id"><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>
                    {equipment.length === 0
                      ? <div className="px-2 py-1.5 text-sm text-muted-foreground">No equipment registered</div>
                      : equipment.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.label}{e.customer && ` — ${e.customer}`}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.equipment_id && <p className="text-sm text-red-600">{errors.equipment_id.message}</p>}
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Equipment cannot be changed after a work order is raised — raise a new one instead.
              </p>
            )}
          </div>

          {enumSelect('workorder_type', 'Type', WORKORDER_TYPES, true)}
          {enumSelect('priority', 'Priority', PRIORITIES)}

          <div className="space-y-2">
            <Label htmlFor="fault_code">Fault code</Label>
            <Input id="fault_code" {...register('fault_code')} placeholder="e.g. E-1042" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service_provider">External provider</Label>
            <Input id="service_provider" {...register('service_provider')} placeholder="If outsourced" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="problem_description">Problem description</Label>
            <Textarea id="problem_description" rows={3} {...register('problem_description')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Scheduling &amp; progress</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {enumSelect('status', 'Status', WORKORDER_STATUSES, true)}
          <div className="space-y-2">
            <Label htmlFor="downtime_hours">Downtime (hours)</Label>
            <Input id="downtime_hours" type="number" step="0.25" min="0" {...register('downtime_hours')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduled_date">Scheduled</Label>
            <Input id="scheduled_date" type="date" {...register('scheduled_date')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_date">Started</Label>
            <Input id="start_date" type="date" {...register('start_date')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="completion_date">Completed{status === 'Completed' && ' *'}</Label>
            <Input id="completion_date" type="date" {...register('completion_date')} />
            {errors.completion_date && <p className="text-sm text-red-600">{errors.completion_date.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Work performed</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="work_description">Work description</Label>
            <Textarea id="work_description" rows={3} {...register('work_description')}
              placeholder="What was actually done on site" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resolution">Resolution{status === 'Completed' && ' *'}</Label>
            <Textarea id="resolution" rows={3} {...register('resolution')}
              placeholder="How the problem was resolved" />
            {errors.resolution && <p className="text-sm text-red-600">{errors.resolution.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Costs</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="labor_cost">Labour cost (₹)</Label>
            <Input id="labor_cost" type="number" step="0.01" min="0" {...register('labor_cost')} />
          </div>
          <div className="space-y-2">
            <Label>Parts cost</Label>
            <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm">
              {money(workOrder?.parts_cost ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">From parts recorded on the work order</p>
          </div>
          <div className="space-y-2">
            <Label>Total</Label>
            <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm font-medium">
              {money(workOrder?.total_cost ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Calculated by the database</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Raise work order'}
        </Button>
      </div>
    </form>
  )
}
