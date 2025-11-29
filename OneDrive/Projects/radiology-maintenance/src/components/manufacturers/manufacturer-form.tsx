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

const manufacturerSchema = z.object({
  manufacturer_code: z.string().min(1, 'Code is required').max(50),
  manufacturer_name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  contact_name: z.string().max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

type ManufacturerFormData = z.infer<typeof manufacturerSchema>

interface ManufacturerFormProps {
  initialData?: ManufacturerFormData & { manufacturer_id?: number }
  mode?: 'create' | 'edit'
}

export function ManufacturerForm({ initialData, mode = 'create' }: ManufacturerFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ManufacturerFormData>({
    resolver: zodResolver(manufacturerSchema) as any,
    defaultValues: (initialData || {
      is_active: true,
    }) as any
  })

  const onSubmit = async (data: ManufacturerFormData) => {
    setIsSubmitting(true)

    try {
      if (mode === 'edit' && initialData?.manufacturer_id) {
        const { error } = await (supabase as any)
          .from('manufacturers')
          .update(data)
          .eq('manufacturer_id', initialData.manufacturer_id)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Manufacturer updated successfully',
        })
      } else {
        const { error } = await (supabase as any)
          .from('manufacturers')
          .insert([data])

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Manufacturer created successfully',
        })
      }

      router.push('/manufacturers')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: mode === 'edit' ? 'Failed to update manufacturer' : 'Failed to create manufacturer',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'edit' ? 'Edit Manufacturer' : 'Create New Manufacturer'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="manufacturer_code">Code *</Label>
              <Input
                {...register('manufacturer_code')}
                placeholder="e.g., GE, SIEMENS"
                className="uppercase"
              />
              {errors.manufacturer_code && (
                <p className="text-sm text-red-500">{errors.manufacturer_code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer_name">Manufacturer Name *</Label>
              <Input
                {...register('manufacturer_name')}
                placeholder="e.g., GE Healthcare"
              />
              {errors.manufacturer_name && (
                <p className="text-sm text-red-500">{errors.manufacturer_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                {...register('contact_name')}
                placeholder="Primary contact person"
              />
              {errors.contact_name && (
                <p className="text-sm text-red-500">{errors.contact_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                {...register('phone')}
                placeholder="+1 (555) 000-0000"
                type="tel"
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                {...register('email')}
                placeholder="contact@manufacturer.com"
                type="email"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                {...register('website')}
                placeholder="https://www.manufacturer.com"
                type="url"
              />
              {errors.website && (
                <p className="text-sm text-red-500">{errors.website.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              {...register('address')}
              placeholder="Street address, city, state, zip"
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('is_active')}
              id="is_active"
              className="h-4 w-4"
            />
            <Label htmlFor="is_active" className="mb-0">Active</Label>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/manufacturers')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Manufacturer' : 'Create Manufacturer')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
