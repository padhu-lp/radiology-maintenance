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
  EQUIPMENT_TYPES, EQUIPMENT_STATUSES, RISK_LEVELS,
  type Equipment, type EquipmentInsert,
} from '@/lib/types/database'

const optionalNumber = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce.number().min(0).optional()
)

const schema = z.object({
  equipment_name: z.string().min(2, 'Equipment name is required').max(255),
  equipment_type: z.enum(EQUIPMENT_TYPES, { message: 'Select an equipment type' }),
  customer_id: z.string().uuid('Select the owning customer'),
  location_id: z.string().optional(),
  manufacturer_id: z.string().optional(),
  model_number: z.string().max(255).optional().or(z.literal('')),
  serial_number: z.string().max(255).optional().or(z.literal('')),
  status: z.enum(EQUIPMENT_STATUSES).default('Active'),
  risk_level: z.string().optional(),
  installation_date: z.string().optional().or(z.literal('')),
  purchase_date: z.string().optional().or(z.literal('')),
  warranty_expiry: z.string().optional().or(z.literal('')),
  purchase_price: optionalNumber,
  notes: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

type Option = { id: string; label: string }

export function EquipmentForm({ equipment }: { equipment?: Equipment }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState<Option[]>([])
  const [manufacturers, setManufacturers] = useState<Option[]>([])
  const [locations, setLocations] = useState<Option[]>([])
  const [loadingRefs, setLoadingRefs] = useState(true)

  const isEdit = Boolean(equipment)

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema) as never,
      defaultValues: {
        equipment_name: equipment?.equipment_name ?? '',
        equipment_type: equipment?.equipment_type ?? undefined,
        customer_id: equipment?.customer_id ?? '',
        location_id: toNone(equipment?.location_id),
        manufacturer_id: toNone(equipment?.manufacturer_id),
        model_number: equipment?.model_number ?? '',
        serial_number: equipment?.serial_number ?? '',
        status: equipment?.status ?? 'Active',
        risk_level: toNone(equipment?.risk_level),
        installation_date: equipment?.installation_date ?? '',
        purchase_date: equipment?.purchase_date ?? '',
        warranty_expiry: equipment?.warranty_expiry ?? '',
        purchase_price: equipment?.purchase_price ?? undefined,
        notes: equipment?.notes ?? '',
      },
    })

  const customerId = watch('customer_id')

  useEffect(() => {
    const load = async () => {
      const [cs, ms] = await Promise.all([
        supabase.from('customers').select('customer_id, customer_name, customer_code')
          .eq('is_active', true).order('customer_name'),
        supabase.from('manufacturers').select('manufacturer_id, manufacturer_name')
          .eq('is_active', true).order('manufacturer_name'),
      ])
      setCustomers((cs.data ?? []).map((c) => ({
        id: c.customer_id, label: `${c.customer_name} (${c.customer_code})`,
      })))
      setManufacturers((ms.data ?? []).map((m) => ({
        id: m.manufacturer_id, label: m.manufacturer_name,
      })))
      setLoadingRefs(false)
    }
    load()
  }, [supabase])

  // Sites belong to a customer, so the list is reloaded whenever the customer
  // changes — and any previously chosen site is cleared, since it belonged to
  // the old customer and would otherwise be saved against the wrong one.
  useEffect(() => {
    if (!customerId) { setLocations([]); return }

    let cancelled = false
    const load = async () => {
      const { data } = await supabase
        .from('locations')
        .select('location_id, department_name, facility_name')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .order('department_name')

      if (cancelled) return

      const opts = (data ?? []).map((l) => ({
        id: l.location_id,
        label: l.facility_name ? `${l.department_name} — ${l.facility_name}` : l.department_name,
      }))
      setLocations(opts)

      const current = watch('location_id')
      if (current && current !== NONE && !opts.some((o) => o.id === current)) {
        setValue('location_id', NONE)
      }
    }
    load()
    return () => { cancelled = true }
  }, [customerId, supabase, setValue, watch])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload = {
        ...nullBlanks(data),
        location_id: fromNone(data.location_id),
        manufacturer_id: fromNone(data.manufacturer_id),
        risk_level: fromNone(data.risk_level),
      } as unknown as EquipmentInsert

      if (isEdit && equipment) {
        const { error } = await supabase
          .from('equipment').update(payload).eq('equipment_id', equipment.equipment_id)
        if (error) throw error
        toast({ title: 'Saved', description: `${data.equipment_name} updated` })
        router.push(`/equipment/${equipment.equipment_id}`)
      } else {
        const { data: created, error } = await supabase
          .from('equipment').insert(payload).select('equipment_id, equipment_code').single()
        if (error) throw error
        if (!created) throw new Error('Equipment created but could not be read back')
        toast({ title: 'Equipment registered', description: `Assigned code ${created.equipment_code}` })
        router.push(`/equipment/${created.equipment_id}`)
      }
      router.refresh()
    } catch (err) {
      const { title, description } = describeDbError(err)
      toast({ title, description, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const selectField = (
    name: 'customer_id' | 'location_id' | 'manufacturer_id' | 'equipment_type' | 'status' | 'risk_level',
    label: string,
    options: readonly Option[] | readonly string[],
    opts: { required?: boolean; allowNone?: boolean; placeholder?: string; disabled?: boolean } = {}
  ) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}{opts.required && ' *'}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select value={field.value || ''} onValueChange={field.onChange} disabled={opts.disabled}>
            <SelectTrigger id={name}>
              <SelectValue placeholder={opts.placeholder ?? `Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {opts.allowNone && <SelectItem value={NONE}>— None —</SelectItem>}
              {options.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">Nothing available</div>
              ) : (
                options.map((o) =>
                  typeof o === 'string'
                    ? <SelectItem key={o} value={o}>{o}</SelectItem>
                    : <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                )
              )}
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
        <CardHeader><CardTitle className="text-base">Identification</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="equipment_name">Equipment name *</Label>
            <Input id="equipment_name" {...register('equipment_name')} placeholder="e.g. Somatom go.Now CT" />
            {errors.equipment_name && <p className="text-sm text-red-600">{errors.equipment_name.message}</p>}
          </div>

          {selectField('equipment_type', 'Type', EQUIPMENT_TYPES, { required: true })}
          {selectField('manufacturer_id', 'Manufacturer', manufacturers, {
            allowNone: true, disabled: loadingRefs,
          })}

          <div className="space-y-2">
            <Label htmlFor="model_number">Model number</Label>
            <Input id="model_number" {...register('model_number')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serial_number">Serial number</Label>
            <Input id="serial_number" {...register('serial_number')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ownership &amp; placement</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {selectField('customer_id', 'Customer', customers, {
            required: true, disabled: loadingRefs,
          })}
          {selectField('location_id', 'Site', locations, {
            allowNone: true,
            disabled: !customerId,
            placeholder: customerId ? 'Select site' : 'Choose a customer first',
          })}
          <p className="text-xs text-muted-foreground sm:col-span-2 -mt-2">
            Sites are managed on the customer&apos;s page. If the list is empty, add one there first.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Lifecycle</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {selectField('status', 'Status', EQUIPMENT_STATUSES, { required: true })}
          {selectField('risk_level', 'Risk level', RISK_LEVELS, { allowNone: true })}

          <div className="space-y-2">
            <Label htmlFor="installation_date">Installation date</Label>
            <Input id="installation_date" type="date" {...register('installation_date')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchase_date">Purchase date</Label>
            <Input id="purchase_date" type="date" {...register('purchase_date')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warranty_expiry">Warranty expiry</Label>
            <Input id="warranty_expiry" type="date" {...register('warranty_expiry')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchase_price">Purchase price (₹)</Label>
            <Input id="purchase_price" type="number" step="0.01" min="0" {...register('purchase_price')} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register('notes')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Register equipment'}
        </Button>
      </div>
    </form>
  )
}
