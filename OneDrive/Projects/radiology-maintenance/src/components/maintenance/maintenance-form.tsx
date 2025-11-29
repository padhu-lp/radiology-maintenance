'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const maintenanceSchema = z.object({
  equipment_id: z.string().min(1, 'Equipment is required'),
  maintenance_type: z.string().min(1, 'Maintenance type is required').max(255),
  frequency: z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'As Needed']),
  frequency_interval: z.coerce.number().optional().nullable(),
  last_performed: z.string().optional().or(z.literal('')).nullable(),
  next_due: z.string().min(1, 'Next due date is required'),
  estimated_hours: z.coerce.number().optional().nullable(),
  required_parts: z.string().optional().or(z.literal('')),
  procedure_details: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

type MaintenanceFormData = z.infer<typeof maintenanceSchema>

interface MaintenanceFormProps {
  initialData?: MaintenanceFormData & { schedule_id?: string }
  mode?: 'create' | 'edit'
}

export function MaintenanceForm({ initialData, mode = 'create' }: MaintenanceFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [equipment, setEquipment] = useState<any[]>([])
  const [loadingEquipment, setLoadingEquipment] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema) as any,
    defaultValues: (initialData || {
      is_active: true,
    }) as any
  })

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('equipment_id, equipment_name, inventory_number')
          .eq('status', 'Active')
          .order('equipment_name', { ascending: true })

        if (error) throw error
        setEquipment(data || [])
      } catch (error) {
        console.error('Error fetching equipment:', error)
        toast({
          title: 'Warning',
          description: 'Could not load equipment',
          variant: 'destructive',
        })
      } finally {
        setLoadingEquipment(false)
      }
    }

    fetchEquipment()
  }, [supabase, toast])

  const onSubmit = async (data: MaintenanceFormData) => {
    setIsSubmitting(true)

    try {
      if (mode === 'edit' && initialData?.schedule_id) {
        const { error } = await (supabase as any)
          .from('schedules')
          .update(data)
          .eq('schedule_id', initialData.schedule_id)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Maintenance schedule updated successfully',
        })
      } else {
        const { error } = await (supabase as any)
          .from('schedules')
          .insert([data])

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Maintenance schedule created successfully',
        })
      }

      router.push('/maintenance')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: mode === 'edit' ? 'Failed to update maintenance schedule' : 'Failed to create maintenance schedule',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'edit' ? 'Edit Maintenance Schedule' : 'Create New Maintenance Schedule'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Equipment and Maintenance Type */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="equipment_id">Equipment *</Label>
              {loadingEquipment ? (
                <div className="p-2 text-gray-500">Loading...</div>
              ) : (
                <Controller
                  name="equipment_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipment.map((equip) => (
                          <SelectItem key={equip.equipment_id} value={equip.equipment_id}>
                            {equip.equipment_name} ({equip.inventory_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.equipment_id && (
                <p className="text-sm text-red-500">{errors.equipment_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance_type">Maintenance Type *</Label>
              <Input
                {...register('maintenance_type')}
                placeholder="e.g., Preventive Maintenance, Calibration"
              />
              {errors.maintenance_type && (
                <p className="text-sm text-red-500">{errors.maintenance_type.message}</p>
              )}
            </div>
          </div>

          {/* Frequency */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Controller
                name="frequency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                      <SelectItem value="As Needed">As Needed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.frequency && (
                <p className="text-sm text-red-500">{errors.frequency.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency_interval">Frequency Interval (days)</Label>
              <Input
                {...register('frequency_interval')}
                type="number"
                min="1"
                placeholder="Number of days between maintenance"
              />
              {errors.frequency_interval && (
                <p className="text-sm text-red-500">{errors.frequency_interval.message}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="last_performed">Last Performed Date</Label>
              <Input
                {...register('last_performed')}
                type="date"
              />
              {errors.last_performed && (
                <p className="text-sm text-red-500">{errors.last_performed.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_due">Next Due Date *</Label>
              <Input
                {...register('next_due')}
                type="date"
              />
              {errors.next_due && (
                <p className="text-sm text-red-500">{errors.next_due.message}</p>
              )}
            </div>
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <Label htmlFor="estimated_hours">Estimated Hours</Label>
            <Input
              {...register('estimated_hours')}
              type="number"
              step="0.5"
              placeholder="0.0"
            />
            {errors.estimated_hours && (
              <p className="text-sm text-red-500">{errors.estimated_hours.message}</p>
            )}
          </div>

          {/* Required Parts */}
          <div className="space-y-2">
            <Label htmlFor="required_parts">Required Parts</Label>
            <Input
              {...register('required_parts')}
              placeholder="e.g., Part A, Part B (comma separated)"
            />
            {errors.required_parts && (
              <p className="text-sm text-red-500">{errors.required_parts.message}</p>
            )}
          </div>

          {/* Procedure Details */}
          <div className="space-y-2">
            <Label htmlFor="procedure_details">Procedure Details</Label>
            <textarea
              {...register('procedure_details')}
              placeholder="Describe the maintenance procedure..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            {errors.procedure_details && (
              <p className="text-sm text-red-500">{errors.procedure_details.message}</p>
            )}
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
              onClick={() => router.push('/maintenance')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Schedule' : 'Create Schedule')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
