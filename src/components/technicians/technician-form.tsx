'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { describeDbError, nullBlanks } from '@/lib/errors'
import type { Technician, TechnicianInsert } from '@/lib/types/database'

const schema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  specialization: z.string().max(255).optional().or(z.literal('')),
  certification: z.string().max(255).optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

export function TechnicianForm({ technician }: { technician?: Technician }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(technician)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      first_name: technician?.first_name ?? '',
      last_name: technician?.last_name ?? '',
      email: technician?.email ?? '',
      phone: technician?.phone ?? '',
      specialization: technician?.specialization ?? '',
      certification: technician?.certification ?? '',
      is_active: technician?.is_active ?? true,
    },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload = nullBlanks(data) as unknown as TechnicianInsert

      if (isEdit && technician) {
        const { error } = await supabase
          .from('technicians').update(payload).eq('technician_id', technician.technician_id)
        if (error) throw error
        toast({ title: 'Saved', description: `${data.first_name} ${data.last_name} updated` })
      } else {
        const { data: created, error } = await supabase
          .from('technicians').insert(payload).select('technician_code').single()
        if (error) throw error
        toast({ title: 'Technician added', description: `Assigned code ${created?.technician_code}` })
      }

      router.push('/technicians')
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
        <CardHeader><CardTitle className="text-base">Technician</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">First name *</Label>
            <Input id="first_name" {...register('first_name')} />
            {errors.first_name && <p className="text-sm text-red-600">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last name *</Label>
            <Input id="last_name" {...register('last_name')} />
            {errors.last_name && <p className="text-sm text-red-600">{errors.last_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Specialisation</Label>
            <Input id="specialization" {...register('specialization')}
              placeholder="e.g. CT & MRI systems" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="certification">Certification</Label>
            <Input id="certification" {...register('certification')}
              placeholder="e.g. Siemens CT Level 2" />
          </div>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register('is_active')} />
            Active — only active technicians appear in work order assignment
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add technician'}
        </Button>
      </div>
    </form>
  )
}
