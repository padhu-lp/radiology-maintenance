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
import type { Manufacturer, ManufacturerInsert } from '@/lib/types/database'

const schema = z.object({
  manufacturer_name: z.string().min(2, 'Name is required').max(255),
  contact_name: z.string().max(255).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  website: z.string().max(255).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

export function ManufacturerForm({ manufacturer }: { manufacturer?: Manufacturer }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(manufacturer)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      manufacturer_name: manufacturer?.manufacturer_name ?? '',
      contact_name: manufacturer?.contact_name ?? '',
      phone: manufacturer?.phone ?? '',
      email: manufacturer?.email ?? '',
      website: manufacturer?.website ?? '',
      address: manufacturer?.address ?? '',
      is_active: manufacturer?.is_active ?? true,
    },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload = nullBlanks(data) as unknown as ManufacturerInsert

      if (isEdit && manufacturer) {
        const { error } = await supabase
          .from('manufacturers')
          .update(payload)
          .eq('manufacturer_id', manufacturer.manufacturer_id)
        if (error) throw error
        toast({ title: 'Saved', description: `${data.manufacturer_name} updated` })
      } else {
        const { data: created, error } = await supabase
          .from('manufacturers')
          .insert(payload)
          .select('manufacturer_code')
          .single()
        if (error) throw error
        toast({ title: 'Manufacturer added', description: `Assigned code ${created?.manufacturer_code}` })
      }

      router.push('/manufacturers')
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
        <CardHeader><CardTitle className="text-base">Manufacturer</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="manufacturer_name">Name *</Label>
            <Input id="manufacturer_name" {...register('manufacturer_name')} placeholder="e.g. Siemens Healthineers" />
            {errors.manufacturer_name && <p className="text-sm text-red-600">{errors.manufacturer_name.message}</p>}
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
            <Label htmlFor="website">Website</Label>
            <Input id="website" {...register('website')} placeholder="https://" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} {...register('address')} />
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
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add manufacturer'}
        </Button>
      </div>
    </form>
  )
}
