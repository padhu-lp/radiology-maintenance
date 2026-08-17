'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { describeDbError, nullBlanks } from '@/lib/errors'
import type { Supplier, SupplierInsert } from '@/lib/types/database'

const optionalNumber = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().min(0).optional()
)

const schema = z.object({
  supplier_name: z.string().min(2, 'Supplier name is required').max(255),
  contact_name: z.string().max(255).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  gst_number: z.string().max(20).optional().or(z.literal('')),
  payment_terms: z.string().max(100).optional().or(z.literal('')),
  lead_time_days: optionalNumber,
  notes: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(supplier)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      supplier_name: supplier?.supplier_name ?? '',
      contact_name: supplier?.contact_name ?? '',
      phone: supplier?.phone ?? '',
      email: supplier?.email ?? '',
      address: supplier?.address ?? '',
      city: supplier?.city ?? '',
      country: supplier?.country ?? 'India',
      gst_number: supplier?.gst_number ?? '',
      payment_terms: supplier?.payment_terms ?? '',
      lead_time_days: supplier?.lead_time_days ?? undefined,
      notes: supplier?.notes ?? '',
      is_active: supplier?.is_active ?? true,
    },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload = nullBlanks(data) as unknown as SupplierInsert

      if (isEdit && supplier) {
        const { error } = await supabase
          .from('suppliers').update(payload).eq('supplier_id', supplier.supplier_id)
        if (error) throw error
        toast({ title: 'Saved', description: `${data.supplier_name} updated` })
      } else {
        const { data: created, error } = await supabase
          .from('suppliers').insert(payload).select('supplier_code').single()
        if (error) throw error
        toast({ title: 'Supplier added', description: `Assigned code ${created?.supplier_code}` })
      }

      router.push('/suppliers')
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
        <CardHeader><CardTitle className="text-base">Supplier</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="supplier_name">Supplier name *</Label>
            <Input id="supplier_name" {...register('supplier_name')} placeholder="e.g. Siemens Service India" />
            {errors.supplier_name && <p className="text-sm text-red-600">{errors.supplier_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact person</Label>
            <Input id="contact_name" {...register('contact_name')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead_time_days">Typical lead time (days)</Label>
            <Input id="lead_time_days" type="number" min="0" {...register('lead_time_days')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Commercial &amp; address</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gst_number">GST number</Label>
            <Input id="gst_number" {...register('gst_number')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_terms">Payment terms</Label>
            <Input id="payment_terms" {...register('payment_terms')} placeholder="e.g. Net 30" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} {...register('address')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register('city')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...register('country')} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} {...register('notes')} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register('is_active')} />
            Active
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add supplier'}
        </Button>
      </div>
    </form>
  )
}
