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
  part_number: z.string().min(1, 'Part number is required').max(10),
  part_name: z.string().min(2, 'Part name is required').max(30),
  equipment_id: z.string().optional().or(z.literal('')).nullable(),
  category: z.string().max(255).optional().or(z.literal('')),
  unit_cost: z.coerce.number().optional().nullable(),
  current_stock: z.coerce.number().default(0),
  minimum_stock: z.coerce.number().optional().nullable(),
  maximum_stock: z.coerce.number().optional().nullable(),
  reorder_point: z.coerce.number().optional().nullable(),
  storage_location: z.string().max(255).optional().or(z.literal('')),
  serial_number: z.string().max(16).optional().or(z.literal('')),
  division: z.string().max(2).optional().or(z.literal('')),
  country: z.string().max(2).optional().or(z.literal('')),
  eq_status: z.string().max(6).optional().or(z.literal('')),
  eq_substatus: z.string().max(6).optional().or(z.literal('')),
  service_partner: z.string().max(6).optional().or(z.literal('')),
  service_partner_name: z.string().max(16).optional().or(z.literal('')),
  location_code: z.string().max(16).optional().or(z.literal('')),
  location_name: z.string().max(30).optional().or(z.literal('')),
  location_short_form: z.string().max(7).optional().or(z.literal('')),
  location_city: z.string().max(6).optional().or(z.literal('')),
  location_zip_code: z.string().max(5).optional().or(z.literal('')),
  date_of_delivery: z.string().optional().or(z.literal('')).nullable(),
  install_date: z.string().optional().or(z.literal('')).nullable(),
  bl_warranty_start_date: z.string().optional().or(z.literal('')).nullable(),
  bl_warranty_end_date: z.string().optional().or(z.literal('')).nullable(),
  customer_warranty_start_date: z.string().optional().or(z.literal('')).nullable(),
  customer_warranty_end_date: z.string().optional().or(z.literal('')).nullable(),
  hq_purchase_order: z.string().max(12).optional().or(z.literal('')),
  hq_sales_order: z.string().max(8).optional().or(z.literal('')),
  end_of_support_date: z.string().optional().or(z.literal('')).nullable(),
  license_type: z.string().max(10).optional().or(z.literal('')),
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
  const [equipment, setEquipment] = useState<any[]>([])
  const [loadingEquipment, setLoadingEquipment] = useState(true)

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
    const fetchEquipment = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('equipment_id, equipment_name')
          .eq('status', 'Active')
          .order('equipment_name', { ascending: true })

        if (error) throw error
        setEquipment(data || [])
      } catch (error) {
        console.error('Error fetching equipment:', error)
        toast({
          title: 'Warning',
          description: 'Could not load equipment list',
          variant: 'destructive',
        })
      } finally {
        setLoadingEquipment(false)
      }
    }

    fetchEquipment()
  }, [supabase, toast])

  const onSubmit = async (data: PartsFormData) => {
    setIsSubmitting(true)

    try {
      const submitData = {
        ...data,
        unit_cost: data.unit_cost || null,
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
          {/* Section 1: Basic Information */}
          <div className="border-b pb-6">
            <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="part_number">Part Number *</Label>
                <Input
                  {...register('part_number')}
                  placeholder="e.g., PN-12345"
                  maxLength={10}
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
                  maxLength={30}
                />
                {errors.part_name && (
                  <p className="text-sm text-red-500">{errors.part_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="equipment_id">Equipment</Label>
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
                          {equipment.map((eq) => (
                            <SelectItem key={eq.equipment_id} value={eq.equipment_id}>
                              {eq.equipment_name}
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
                  maxLength={255}
                />
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Inventory Management */}
          <div className="border-b pb-6">
            <h3 className="font-semibold text-lg mb-4">Inventory Management</h3>
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

            <div className="grid grid-cols-3 gap-4 mt-4">
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
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="storage_location">Storage Location</Label>
              <Input
                {...register('storage_location')}
                placeholder="e.g., Shelf A3, Bin 12"
                maxLength={255}
              />
              {errors.storage_location && (
                <p className="text-sm text-red-500">{errors.storage_location.message}</p>
              )}
            </div>
          </div>

          {/* Section 3: Equipment Details */}
          <div className="border-b pb-6">
            <h3 className="font-semibold text-lg mb-4">Equipment Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  {...register('serial_number')}
                  placeholder="Hardware serial number"
                  maxLength={16}
                />
                {errors.serial_number && (
                  <p className="text-sm text-red-500">{errors.serial_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="eq_status">Equipment Status</Label>
                <Input
                  {...register('eq_status')}
                  placeholder="e.g., Active, Inactive"
                  maxLength={6}
                />
                {errors.eq_status && (
                  <p className="text-sm text-red-500">{errors.eq_status.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="eq_substatus">Equipment Sub-Status</Label>
                <Input
                  {...register('eq_substatus')}
                  placeholder="Detailed status reason"
                  maxLength={6}
                />
                {errors.eq_substatus && (
                  <p className="text-sm text-red-500">{errors.eq_substatus.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_type">License Type</Label>
                <Input
                  {...register('license_type')}
                  placeholder="Software license category"
                  maxLength={10}
                />
                {errors.license_type && (
                  <p className="text-sm text-red-500">{errors.license_type.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Location Information */}
          <div className="border-b pb-6">
            <h3 className="font-semibold text-lg mb-4">Location Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location_code">Location Code</Label>
                <Input
                  {...register('location_code')}
                  placeholder="Technical location ID"
                  maxLength={16}
                />
                {errors.location_code && (
                  <p className="text-sm text-red-500">{errors.location_code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_name">Location Name</Label>
                <Input
                  {...register('location_name')}
                  placeholder="Installation facility name"
                  maxLength={30}
                />
                {errors.location_name && (
                  <p className="text-sm text-red-500">{errors.location_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="location_city">City</Label>
                <Input
                  {...register('location_city')}
                  placeholder="City of installation"
                  maxLength={6}
                />
                {errors.location_city && (
                  <p className="text-sm text-red-500">{errors.location_city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_zip_code">Postal Code</Label>
                <Input
                  {...register('location_zip_code')}
                  placeholder="Postal code"
                  maxLength={5}
                />
                {errors.location_zip_code && (
                  <p className="text-sm text-red-500">{errors.location_zip_code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_short_form">Location Type</Label>
                <Input
                  {...register('location_short_form')}
                  placeholder="Facility type"
                  maxLength={7}
                />
                {errors.location_short_form && (
                  <p className="text-sm text-red-500">{errors.location_short_form.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Service Information */}
          <div className="border-b pb-6">
            <h3 className="font-semibold text-lg mb-4">Service Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="service_partner">Service Partner ID</Label>
                <Input
                  {...register('service_partner')}
                  placeholder="Partner ID code"
                  maxLength={6}
                />
                {errors.service_partner && (
                  <p className="text-sm text-red-500">{errors.service_partner.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_partner_name">Service Partner Name</Label>
                <Input
                  {...register('service_partner_name')}
                  placeholder="Partner company name"
                  maxLength={16}
                />
                {errors.service_partner_name && (
                  <p className="text-sm text-red-500">{errors.service_partner_name.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 6: Geographic Information */}
          <div className="border-b pb-6">
            <h3 className="font-semibold text-lg mb-4">Geographic Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="division">Division</Label>
                <Input
                  {...register('division')}
                  placeholder="Business segment code"
                  maxLength={2}
                />
                {errors.division && (
                  <p className="text-sm text-red-500">{errors.division.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country Code</Label>
                <Input
                  {...register('country')}
                  placeholder="Country code (e.g., US, IN)"
                  maxLength={2}
                />
                {errors.country && (
                  <p className="text-sm text-red-500">{errors.country.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 7: Warranty Information */}
          <div className="border-b pb-6">
            <h3 className="font-semibold text-lg mb-4">Warranty Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="bl_warranty_start_date">Base Warranty Start</Label>
                <Input
                  {...register('bl_warranty_start_date')}
                  type="date"
                />
                {errors.bl_warranty_start_date && (
                  <p className="text-sm text-red-500">{errors.bl_warranty_start_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bl_warranty_end_date">Base Warranty End</Label>
                <Input
                  {...register('bl_warranty_end_date')}
                  type="date"
                />
                {errors.bl_warranty_end_date && (
                  <p className="text-sm text-red-500">{errors.bl_warranty_end_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="customer_warranty_start_date">Customer Warranty Start</Label>
                <Input
                  {...register('customer_warranty_start_date')}
                  type="date"
                />
                {errors.customer_warranty_start_date && (
                  <p className="text-sm text-red-500">{errors.customer_warranty_start_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_warranty_end_date">Customer Warranty End</Label>
                <Input
                  {...register('customer_warranty_end_date')}
                  type="date"
                />
                {errors.customer_warranty_end_date && (
                  <p className="text-sm text-red-500">{errors.customer_warranty_end_date.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 8: Dates and Orders */}
          <div className="border-b pb-6">
            <h3 className="font-semibold text-lg mb-4">Dates and Orders</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date_of_delivery">Date of Delivery</Label>
                <Input
                  {...register('date_of_delivery')}
                  type="date"
                />
                {errors.date_of_delivery && (
                  <p className="text-sm text-red-500">{errors.date_of_delivery.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="install_date">Installation Date</Label>
                <Input
                  {...register('install_date')}
                  type="date"
                />
                {errors.install_date && (
                  <p className="text-sm text-red-500">{errors.install_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="hq_purchase_order">HQ Purchase Order</Label>
                <Input
                  {...register('hq_purchase_order')}
                  placeholder="Purchase order number"
                  maxLength={12}
                />
                {errors.hq_purchase_order && (
                  <p className="text-sm text-red-500">{errors.hq_purchase_order.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hq_sales_order">HQ Sales Order</Label>
                <Input
                  {...register('hq_sales_order')}
                  placeholder="Sales order number"
                  maxLength={8}
                />
                {errors.hq_sales_order && (
                  <p className="text-sm text-red-500">{errors.hq_sales_order.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="end_of_support_date">End of Support Date</Label>
              <Input
                {...register('end_of_support_date')}
                type="date"
              />
              {errors.end_of_support_date && (
                <p className="text-sm text-red-500">{errors.end_of_support_date.message}</p>
              )}
            </div>
          </div>

          {/* Section 9: Status */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Status</h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('is_active')}
                id="is_active"
                className="h-4 w-4"
              />
              <Label htmlFor="is_active" className="mb-0">Active</Label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
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
