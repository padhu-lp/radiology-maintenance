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

const partsSchema = z.object({
  part_number: z.string().min(1, 'Part number is required').max(255),
  part_name: z.string().min(2, 'Part name is required').max(255),
  manufacturer_id: z.string().optional().or(z.literal('')).nullable(),
  category: z.string().max(255).optional().or(z.literal('')),
  unit_cost: z.coerce.number().optional().nullable(),
  current_stock: z.coerce.number().default(0),
  minimum_stock: z.coerce.number().optional().nullable(),
  maximum_stock: z.coerce.number().optional().nullable(),
  reorder_point: z.coerce.number().optional().nullable(),
  storage_location: z.string().max(255).optional().or(z.literal('')),
  lead_time_days: z.coerce.number().optional().nullable(),
  expiry_date: z.string().optional().or(z.literal('')).nullable(),
  is_active: z.boolean().default(true),
})

type PartsFormData = z.infer<typeof partsSchema>

interface PartsFormProps {
  initialData?: PartsFormData & { part_id?: string }
  mode?: 'create' | 'edit'
}

export function PartsForm({ initialData, mode = 'create' }: PartsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [loadingManufacturers, setLoadingManufacturers] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<PartsFormData>({
    resolver: zodResolver(partsSchema) as any,
    defaultValues: (initialData || {
      is_active: true,
      current_stock: 0,
    }) as any
  })

  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        const { data, error } = await supabase
          .from('manufacturers')
          .select('manufacturer_id, manufacturer_name')
          .eq('is_active', true)
          .order('manufacturer_name', { ascending: true })

        if (error) throw error
        setManufacturers(data || [])
      } catch (error) {
        console.error('Error fetching manufacturers:', error)
        toast({
          title: 'Warning',
          description: 'Could not load manufacturers',
          variant: 'destructive',
        })
      } finally {
        setLoadingManufacturers(false)
      }
    }

    fetchManufacturers()
  }, [supabase, toast])

  const onSubmit = async (data: PartsFormData) => {
    setIsSubmitting(true)

    try {
      const submitData = {
        ...data,
        manufacturer_id: data.manufacturer_id ? parseInt(data.manufacturer_id) : null,
      }

      if (mode === 'edit' && initialData?.part_id) {
        const { error } = await (supabase as any)
          .from('parts_inventory')
          .update(submitData)
          .eq('part_id', initialData.part_id)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Part updated successfully',
        })
      } else {
        const { error } = await (supabase as any)
          .from('parts_inventory')
          .insert([submitData])

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Part created successfully',
        })
      }

      router.push('/parts-inventory')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: mode === 'edit' ? 'Failed to update part' : 'Failed to create part',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'edit' ? 'Edit Part' : 'Create New Part'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Part Number and Name */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="part_number">Part Number *</Label>
              <Input
                {...register('part_number')}
                placeholder="e.g., PN-12345"
              />
              {errors.part_number && (
                <p className="text-sm text-red-500">{errors.part_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="part_name">Part Name *</Label>
              <Input
                {...register('part_name')}
                placeholder="e.g., X-Ray Tube"
              />
              {errors.part_name && (
                <p className="text-sm text-red-500">{errors.part_name.message}</p>
              )}
            </div>
          </div>

          {/* Manufacturer and Category */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="manufacturer_id">Manufacturer</Label>
              {loadingManufacturers ? (
                <div className="p-2 text-gray-500">Loading...</div>
              ) : (
                <Controller
                  name="manufacturer_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manufacturer" />
                      </SelectTrigger>
                      <SelectContent>
                        {manufacturers.map((mfg) => (
                          <SelectItem key={mfg.manufacturer_id} value={mfg.manufacturer_id.toString()}>
                            {mfg.manufacturer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                {...register('category')}
                placeholder="e.g., Electronics, Mechanical"
              />
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Stock Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="current_stock">Current Stock *</Label>
              <Input
                {...register('current_stock')}
                type="number"
                min="0"
                placeholder="0"
              />
              {errors.current_stock && (
                <p className="text-sm text-red-500">{errors.current_stock.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_cost">Unit Cost</Label>
              <Input
                {...register('unit_cost')}
                type="number"
                step="0.01"
                placeholder="0.00"
              />
              {errors.unit_cost && (
                <p className="text-sm text-red-500">{errors.unit_cost.message}</p>
              )}
            </div>
          </div>

          {/* Min/Max Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minimum_stock">Minimum Stock</Label>
              <Input
                {...register('minimum_stock')}
                type="number"
                min="0"
                placeholder="0"
              />
              {errors.minimum_stock && (
                <p className="text-sm text-red-500">{errors.minimum_stock.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_point">Reorder Point</Label>
              <Input
                {...register('reorder_point')}
                type="number"
                min="0"
                placeholder="0"
              />
              {errors.reorder_point && (
                <p className="text-sm text-red-500">{errors.reorder_point.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maximum_stock">Maximum Stock</Label>
              <Input
                {...register('maximum_stock')}
                type="number"
                min="0"
                placeholder="0"
              />
              {errors.maximum_stock && (
                <p className="text-sm text-red-500">{errors.maximum_stock.message}</p>
              )}
            </div>
          </div>

          {/* Storage and Lead Time */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="storage_location">Storage Location</Label>
              <Input
                {...register('storage_location')}
                placeholder="e.g., Shelf A3, Bin 12"
              />
              {errors.storage_location && (
                <p className="text-sm text-red-500">{errors.storage_location.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_time_days">Lead Time (days)</Label>
              <Input
                {...register('lead_time_days')}
                type="number"
                min="0"
                placeholder="0"
              />
              {errors.lead_time_days && (
                <p className="text-sm text-red-500">{errors.lead_time_days.message}</p>
              )}
            </div>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiry_date">Expiry Date</Label>
            <Input
              {...register('expiry_date')}
              type="date"
            />
            {errors.expiry_date && (
              <p className="text-sm text-red-500">{errors.expiry_date.message}</p>
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
              onClick={() => router.push('/parts-inventory')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Part' : 'Create Part')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
