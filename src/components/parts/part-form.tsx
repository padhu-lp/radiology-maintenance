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
import { EQUIPMENT_TYPES, type PartsInventory, type PartInsert } from '@/lib/types/database'

const optionalInt = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().min(0).optional()
)
const optionalMoney = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce.number().min(0).optional()
)

const UNITS = ['Each', 'Pair', 'Set', 'Metre', 'Litre', 'Box', 'Pack'] as const

const schema = z.object({
  part_name: z.string().min(2, 'Part name is required').max(255),
  part_number: z.string().min(1, 'Manufacturer part number is required').max(100),
  manufacturer_id: z.string().optional(),
  supplier_id: z.string().optional(),
  equipment_type: z.string().optional(),
  category: z.string().max(100).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  unit_of_measure: z.string().default('Each'),
  unit_cost: optionalMoney,
  quantity_on_hand: optionalInt,
  minimum_stock: optionalInt,
  reorder_point: optionalInt,
  storage_location: z.string().max(255).optional().or(z.literal('')),
  lead_time_days: optionalInt,
  is_consumable: z.boolean().default(false),
  is_active: z.boolean().default(true),
}).superRefine((d, ctx) => {
  // Mirrors parts_inventory_reorder_sane: reordering below the floor is a slip.
  if (d.reorder_point !== undefined && d.minimum_stock !== undefined
      && d.reorder_point < d.minimum_stock) {
    ctx.addIssue({
      code: 'custom', path: ['reorder_point'],
      message: 'Reorder point must be at or above the minimum stock level',
    })
  }
})

type FormData = z.infer<typeof schema>
type Option = { id: string; label: string }

export function PartForm({ part }: { part?: PartsInventory }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [manufacturers, setManufacturers] = useState<Option[]>([])
  const [suppliers, setSuppliers] = useState<Option[]>([])
  const isEdit = Boolean(part)

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      part_name: part?.part_name ?? '',
      part_number: part?.part_number ?? '',
      manufacturer_id: toNone(part?.manufacturer_id),
      supplier_id: toNone(part?.supplier_id),
      equipment_type: toNone(part?.equipment_type),
      category: part?.category ?? '',
      description: part?.description ?? '',
      unit_of_measure: part?.unit_of_measure ?? 'Each',
      unit_cost: part?.unit_cost ?? undefined,
      quantity_on_hand: part?.quantity_on_hand ?? 0,
      minimum_stock: part?.minimum_stock ?? undefined,
      reorder_point: part?.reorder_point ?? undefined,
      storage_location: part?.storage_location ?? '',
      lead_time_days: part?.lead_time_days ?? undefined,
      is_consumable: part?.is_consumable ?? false,
      is_active: part?.is_active ?? true,
    },
  })

  useEffect(() => {
    const load = async () => {
      const [m, s] = await Promise.all([
        supabase.from('manufacturers').select('manufacturer_id, manufacturer_name')
          .eq('is_active', true).order('manufacturer_name'),
        supabase.from('suppliers').select('supplier_id, supplier_name')
          .eq('is_active', true).order('supplier_name'),
      ])
      setManufacturers((m.data ?? []).map((x) => ({ id: x.manufacturer_id, label: x.manufacturer_name })))
      setSuppliers((s.data ?? []).map((x) => ({ id: x.supplier_id, label: x.supplier_name })))
    }
    load()
  }, [supabase])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload = {
        ...nullBlanks(data),
        manufacturer_id: fromNone(data.manufacturer_id),
        supplier_id: fromNone(data.supplier_id),
        equipment_type: fromNone(data.equipment_type),
      } as unknown as PartInsert

      if (isEdit && part) {
        // quantity_on_hand is deliberately excluded from edits: stock moves via
        // parts recorded on work orders, not by typing a new number here.
        const { quantity_on_hand: _ignored, ...rest } = payload as Record<string, unknown>
        void _ignored
        const { error } = await supabase
          .from('parts_inventory').update(rest as PartInsert).eq('part_id', part.part_id)
        if (error) throw error
        toast({ title: 'Saved', description: `${data.part_name} updated` })
      } else {
        const { data: created, error } = await supabase
          .from('parts_inventory').insert(payload).select('part_code').single()
        if (error) throw error
        toast({ title: 'Part added', description: `Assigned code ${created?.part_code}` })
      }

      router.push('/parts')
      router.refresh()
    } catch (err) {
      const { title, description } = describeDbError(err)
      toast({ title, description, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const sel = (
    name: 'manufacturer_id' | 'supplier_id' | 'equipment_type' | 'unit_of_measure',
    label: string,
    options: readonly Option[] | readonly string[],
    allowNone = true
  ) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select value={field.value || (allowNone ? NONE : '')} onValueChange={field.onChange}>
            <SelectTrigger id={name}><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
            <SelectContent>
              {allowNone && <SelectItem value={NONE}>— None —</SelectItem>}
              {options.map((o) =>
                typeof o === 'string'
                  ? <SelectItem key={o} value={o}>{o}</SelectItem>
                  : <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Part</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="part_name">Part name *</Label>
            <Input id="part_name" {...register('part_name')} placeholder="e.g. CT X-Ray Tube" />
            {errors.part_name && <p className="text-sm text-red-600">{errors.part_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="part_number">Manufacturer part number *</Label>
            <Input id="part_number" {...register('part_number')} placeholder="e.g. CTXT-9001" />
            {errors.part_number && <p className="text-sm text-red-600">{errors.part_number.message}</p>}
            <p className="text-xs text-muted-foreground">
              Our own catalogue code (PART-nnnn) is assigned automatically.
            </p>
          </div>
          {sel('equipment_type', 'Fits equipment type', EQUIPMENT_TYPES)}
          {sel('manufacturer_id', 'Manufacturer', manufacturers)}
          {sel('supplier_id', 'Supplier', suppliers)}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" {...register('category')} placeholder="e.g. Tubes, Detectors, Cables" />
          </div>
          {sel('unit_of_measure', 'Unit of measure', UNITS, false)}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register('description')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Stock &amp; cost</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="unit_cost">Unit cost (₹)</Label>
            <Input id="unit_cost" type="number" step="0.01" min="0" {...register('unit_cost')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity_on_hand">Stock on hand</Label>
            <Input
              id="quantity_on_hand"
              type="number" min="0"
              disabled={isEdit}
              {...register('quantity_on_hand')}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Stock changes when parts are recorded on work orders, not here.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage_location">Storage location</Label>
            <Input id="storage_location" {...register('storage_location')} placeholder="e.g. Rack B2" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimum_stock">Minimum stock</Label>
            <Input id="minimum_stock" type="number" min="0" {...register('minimum_stock')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reorder_point">Reorder level</Label>
            <Input id="reorder_point" type="number" min="0" {...register('reorder_point')} />
            {errors.reorder_point && <p className="text-sm text-red-600">{errors.reorder_point.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead_time_days">Lead time (days)</Label>
            <Input id="lead_time_days" type="number" min="0" {...register('lead_time_days')} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register('is_consumable')} />
            Consumable
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register('is_active')} />
            Active
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add part'}
        </Button>
      </div>
    </form>
  )
}
