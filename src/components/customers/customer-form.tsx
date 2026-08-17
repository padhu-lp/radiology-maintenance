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
import type { Customer, CustomerInsert } from '@/lib/types/database'

const schema = z.object({
  customer_name:  z.string().min(2, 'Customer name is required').max(255),
  contact_name:   z.string().max(255).optional().or(z.literal('')),
  phone:          z.string().max(30).optional().or(z.literal('')),
  email:          z.string().email('Enter a valid email').optional().or(z.literal('')),
  address:        z.string().optional().or(z.literal('')),
  city:           z.string().max(100).optional().or(z.literal('')),
  state_province: z.string().max(100).optional().or(z.literal('')),
  postal_code:    z.string().max(20).optional().or(z.literal('')),
  country:        z.string().max(100).optional().or(z.literal('')),
  notes:          z.string().optional().or(z.literal('')),
  is_active:      z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

/** Empty strings must become NULL, not '' — keeps "no value" unambiguous. */
function nullBlanks<T extends Record<string, unknown>>(data: T) {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) out[k] = v === '' ? null : v
  return out
}

export function CustomerForm({ customer }: { customer?: Customer }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const isEdit = Boolean(customer)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      customer_name:  customer?.customer_name  ?? '',
      contact_name:   customer?.contact_name   ?? '',
      phone:          customer?.phone          ?? '',
      email:          customer?.email          ?? '',
      address:        customer?.address        ?? '',
      city:           customer?.city           ?? '',
      state_province: customer?.state_province ?? '',
      postal_code:    customer?.postal_code    ?? '',
      country:        customer?.country        ?? 'India',
      notes:          customer?.notes          ?? '',
      is_active:      customer?.is_active      ?? true,
    },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload = nullBlanks(data) as unknown as CustomerInsert

      if (isEdit && customer) {
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('customer_id', customer.customer_id)
        if (error) throw error

        toast({ title: 'Saved', description: `${data.customer_name} updated` })
        router.push(`/customers/${customer.customer_id}`)
      } else {
        const { data: created, error } = await supabase
          .from('customers')
          .insert(payload)
          .select('customer_id, customer_code')
          .single()
        if (error) throw error
        if (!created) throw new Error('Customer was created but could not be read back')

        toast({
          title: 'Customer created',
          description: `Assigned code ${created.customer_code}`,
        })
        router.push(`/customers/${created.customer_id}`)
      }
      router.refresh()
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string }
      // 42501 = insufficient_privilege, raised by RLS for non-admins.
      const denied = e?.code === '42501' || e?.message?.includes('row-level security')
      toast({
        title: denied ? 'Permission denied' : 'Could not save',
        description: denied
          ? 'Only administrators can add or change customers.'
          : e?.message ?? 'Unexpected error',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Customer details</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="customer_name">Customer name *</Label>
            <Input id="customer_name" {...register('customer_name')} placeholder="e.g. Apollo Diagnostics" />
            {errors.customer_name && <p className="text-sm text-red-600">{errors.customer_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact person</Label>
            <Input id="contact_name" {...register('contact_name')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} placeholder="+91 ..." />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Street address</Label>
            <Textarea id="address" rows={2} {...register('address')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register('city')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state_province">State</Label>
            <Input id="state_province" {...register('state_province')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal code</Label>
            <Input id="postal_code" {...register('postal_code')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...register('country')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Other</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register('notes')} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register('is_active')} />
            Active customer
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create customer'}
        </Button>
      </div>
    </form>
  )
}
