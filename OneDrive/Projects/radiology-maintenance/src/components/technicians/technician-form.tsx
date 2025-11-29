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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Controller } from 'react-hook-form'

const technicianSchema = z.object({
  technician_code: z.string().min(1, 'Code is required').max(50),
  first_name: z.string().min(2, 'First name is required').max(100),
  last_name: z.string().min(2, 'Last name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  specialization: z.string().max(255).optional().or(z.literal('')),
  certification: z.string().max(255).optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

type TechnicianFormData = z.infer<typeof technicianSchema>

interface TechnicianFormProps {
  initialData?: TechnicianFormData & { technician_id?: string }
  mode?: 'create' | 'edit'
}

export function TechnicianForm({ initialData, mode = 'create' }: TechnicianFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<TechnicianFormData>({
    resolver: zodResolver(technicianSchema) as any,
    defaultValues: (initialData || {
      is_active: true,
    }) as any
  })

  const onSubmit = async (data: TechnicianFormData) => {
    setIsSubmitting(true)

    try {
      if (mode === 'edit' && initialData?.technician_id) {
        const { error } = await (supabase as any)
          .from('technicians')
          .update(data)
          .eq('technician_id', initialData.technician_id)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Technician updated successfully',
        })
      } else {
        const { error } = await (supabase as any)
          .from('technicians')
          .insert([data])

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Technician created successfully',
        })
      }

      router.push('/technicians')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: mode === 'edit' ? 'Failed to update technician' : 'Failed to create technician',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'edit' ? 'Edit Technician' : 'Create New Technician'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="technician_code">Technician Code *</Label>
            <Input
              {...register('technician_code')}
              placeholder="e.g., TECH001"
            />
            {errors.technician_code && (
              <p className="text-sm text-red-500">{errors.technician_code.message}</p>
            )}
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                {...register('first_name')}
                placeholder="First name"
              />
              {errors.first_name && (
                <p className="text-sm text-red-500">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                {...register('last_name')}
                placeholder="Last name"
              />
              {errors.last_name && (
                <p className="text-sm text-red-500">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                {...register('email')}
                placeholder="technician@example.com"
                type="email"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
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
          </div>

          {/* Specialization and Certification */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                {...register('specialization')}
                placeholder="e.g., CT Scan, X-Ray, Ultrasound"
              />
              {errors.specialization && (
                <p className="text-sm text-red-500">{errors.specialization.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="certification">Certification</Label>
              <Input
                {...register('certification')}
                placeholder="e.g., ARRT, RCEP"
              />
              {errors.certification && (
                <p className="text-sm text-red-500">{errors.certification.message}</p>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('is_active')}
              id="is_active"
              className="h-4 w-4"
            />
            <Label htmlFor="is_active" className="mb-0">Active</Label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/technicians')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Technician' : 'Create Technician')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
