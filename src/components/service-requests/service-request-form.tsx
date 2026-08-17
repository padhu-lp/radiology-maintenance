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
import { describeDbError, nullBlanks, NONE, fromNone, toNone } from '@/lib/errors'
import {
  REQUEST_CHANNELS, URGENCIES,
  type ServiceRequest, type ServiceRequestInsert,
} from '@/lib/types/database'

const schema = z.object({
  customer_id: z.string().uuid('Select the customer who called'),
  equipment_id: z.string().optional(),
  channel: z.enum(REQUEST_CHANNELS).default('Phone'),
  reported_by_name: z.string().max(255).optional().or(z.literal('')),
  reported_by_phone: z.string().max(30).optional().or(z.literal('')),
  problem_summary: z.string().min(5, 'Give a short summary (at least 5 characters)').max(255),
  problem_details: z.string().optional().or(z.literal('')),
  urgency: z.enum(URGENCIES).default('Medium'),
})

type FormData = z.infer<typeof schema>
type Option = { id: string; label: string }

export function ServiceRequestForm({ request }: { request?: ServiceRequest }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState<Option[]>([])
  const [equipment, setEquipment] = useState<Option[]>([])
  const isEdit = Boolean(request)

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema) as never,
      defaultValues: {
        customer_id: request?.customer_id ?? '',
        equipment_id: toNone(request?.equipment_id),
        channel: request?.channel ?? 'Phone',
        reported_by_name: request?.reported_by_name ?? '',
        reported_by_phone: request?.reported_by_phone ?? '',
        problem_summary: request?.problem_summary ?? '',
        problem_details: request?.problem_details ?? '',
        urgency: request?.urgency ?? 'Medium',
      },
    })

  const customerId = watch('customer_id')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('customers').select('customer_id, customer_name, customer_code')
        .eq('is_active', true).order('customer_name')
      setCustomers((data ?? []).map((c) => ({
        id: c.customer_id, label: `${c.customer_name} (${c.customer_code})`,
      })))
    }
    load()
  }, [supabase])

  // Only show machines belonging to the selected customer, and drop a stale
  // selection if the customer changes.
  useEffect(() => {
    if (!customerId) { setEquipment([]); return }
    let cancelled = false

    const load = async () => {
      const { data } = await supabase
        .from('equipment')
        .select('equipment_id, equipment_name, equipment_code, equipment_type')
        .eq('customer_id', customerId)
        .order('equipment_name')
      if (cancelled) return

      const opts = (data ?? []).map((e) => ({
        id: e.equipment_id,
        label: `${e.equipment_name} · ${e.equipment_type} (${e.equipment_code})`,
      }))
      setEquipment(opts)

      const current = watch('equipment_id')
      if (current && current !== NONE && !opts.some((o) => o.id === current)) {
        setValue('equipment_id', NONE)
      }
    }
    load()
    return () => { cancelled = true }
  }, [customerId, supabase, setValue, watch])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const base = {
        ...nullBlanks(data),
        equipment_id: fromNone(data.equipment_id),
      }

      if (isEdit && request) {
        const { error } = await supabase
          .from('service_requests')
          .update(base as unknown as ServiceRequestInsert)
          .eq('request_id', request.request_id)
        if (error) throw error
        toast({ title: 'Saved', description: `${request.request_number} updated` })
        router.push(`/service-requests/${request.request_id}`)
      } else {
        // Record who took the call. received_at defaults to now() in the database.
        const { data: { user } } = await supabase.auth.getUser()

        const { data: created, error } = await supabase
          .from('service_requests')
          .insert({ ...base, received_by: user?.id ?? null } as unknown as ServiceRequestInsert)
          .select('request_id, request_number')
          .single()
        if (error) throw error
        if (!created) throw new Error('Request created but could not be read back')

        toast({ title: 'Service request logged', description: created.request_number })
        router.push(`/service-requests/${created.request_id}`)
      }
      router.refresh()
    } catch (err) {
      const { title, description } = describeDbError(err)
      toast({ title, description, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Who is reporting</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer_id">Customer *</Label>
            <Controller
              name="customer_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger id="customer_id"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.length === 0
                      ? <div className="px-2 py-1.5 text-sm text-muted-foreground">No customers yet</div>
                      : customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.customer_id && <p className="text-sm text-red-600">{errors.customer_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel">Channel</Label>
            <Controller
              name="channel"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="channel"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REQUEST_CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reported_by_name">Caller name</Label>
            <Input id="reported_by_name" {...register('reported_by_name')} placeholder="Who called" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reported_by_phone">Caller phone</Label>
            <Input id="reported_by_phone" {...register('reported_by_phone')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">The problem</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="equipment_id">Equipment</Label>
            <Controller
              name="equipment_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || NONE}
                  onValueChange={field.onChange}
                  disabled={!customerId}
                >
                  <SelectTrigger id="equipment_id">
                    <SelectValue placeholder={customerId ? 'Select equipment' : 'Choose a customer first'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not identified yet</SelectItem>
                    {equipment.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Leave as &ldquo;not identified&rdquo; if the caller cannot say which machine — you can attach it during triage.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgency">Urgency</Label>
            <Controller
              name="urgency"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="urgency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {URGENCIES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="problem_summary">Summary *</Label>
            <Input
              id="problem_summary"
              {...register('problem_summary')}
              placeholder="One line, e.g. CT scanner making grinding noise during rotation"
            />
            {errors.problem_summary && <p className="text-sm text-red-600">{errors.problem_summary.message}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="problem_details">Details</Label>
            <Textarea
              id="problem_details"
              rows={4}
              {...register('problem_details')}
              placeholder="What the caller described: when it started, error codes, what they have already tried…"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Log request'}
        </Button>
      </div>
    </form>
  )
}
