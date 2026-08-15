'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const equipmentSchema = z.object({
  inventory_number: z.string().min(1, 'Inventory number is required'),
  equipment_name: z.string().min(2, 'Equipment name is required'),
  equipment_type: z.string().min(1, 'Equipment type is required'),
  manufacturer_id: z.string().optional().or(z.literal('')).nullable(),
  location_id: z.string().optional().or(z.literal('')).nullable(),
  serial_number: z.string().optional().or(z.literal('')).nullable(),
  model_number: z.string().optional().or(z.literal('')).nullable(),
  installation_date: z.string().optional().or(z.literal('')).nullable(),
  purchase_date: z.string().optional().or(z.literal('')).nullable(),
  purchase_price: z.coerce.number().optional().nullable(),
  warranty_expiry: z.string().optional().or(z.literal('')).nullable(),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().nullable(),
  status: z.enum(['Active', 'Inactive', 'Under Maintenance', 'Decommissioned']),
  // Internal field - not saved to DB, used only for cascading UI
  _customer_id: z.string().optional().or(z.literal('')).nullable(),
}).transform((data) => ({
  ...data,
  status: data.status || 'Active'
}))

type EquipmentFormData = z.infer<typeof equipmentSchema>

interface EquipmentFormProps {
  initialData?: EquipmentFormData & { equipment_id?: string }
  mode?: 'create' | 'edit'
}

export function EquipmentForm({ initialData, mode = 'create' }: EquipmentFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(true)
  const [loadingLocations, setLoadingLocations] = useState(false)
  const previousCustomerIdRef = useRef<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    getValues,
    setValue,
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema) as any,
    defaultValues: (initialData || {
      status: 'Active',
    }) as any
  })

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [manufacturersData, customersData] = await Promise.all([
          supabase.from('manufacturers').select('manufacturer_id, manufacturer_name').eq('is_active', true),
          supabase.from('customers').select('customer_id, customer_name').eq('is_active', true),
        ])

        if (manufacturersData.error) throw manufacturersData.error
        if (customersData.error) throw customersData.error

        setManufacturers(manufacturersData.data || [])
        setCustomers(customersData.data || [])
      } catch (error) {
        console.error('Error fetching dropdown data:', error)
        toast({
          title: 'Warning',
          description: 'Could not load manufacturers or customers',
          variant: 'destructive',
        })
      } finally {
        setLoadingDropdowns(false)
      }
    }

    fetchDropdownData()
  }, [supabase, toast])

  // Function to fetch locations for a customer
  const fetchLocationsForCustomer = async (customerId: string | null) => {
    if (!customerId) {
      setLocations([])
      return
    }

    setLoadingLocations(true)
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('location_id, department_name')
        .eq('customer_id', parseInt(customerId))
        .eq('is_active', true)

      if (error) throw error
      setLocations(data || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
      toast({
        title: 'Warning',
        description: 'Could not load locations for selected customer',
        variant: 'destructive',
      })
      setLocations([])
    } finally {
      setLoadingLocations(false)
    }
  }

  const onSubmit = async (data: EquipmentFormData) => {
    setIsSubmitting(true)

    try {
      // Convert string IDs to numbers for foreign keys and remove internal fields
      const { _customer_id, ...dataWithoutInternalFields } = data as any
      const submitData = {
        ...dataWithoutInternalFields,
        manufacturer_id: data.manufacturer_id ? parseInt(data.manufacturer_id) : null,
        location_id: data.location_id ? parseInt(data.location_id) : null,
        purchase_price: data.purchase_price || null,
      }

      if (mode === 'edit' && initialData?.equipment_id) {
        const { error } = await (supabase as any)
          .from('inventory')
          .update(submitData)
          .eq('equipment_id', initialData.equipment_id)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Equipment updated successfully',
        })
      } else {
        const { error } = await (supabase as any)
          .from('inventory')
          .insert([submitData])

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Equipment created successfully',
        })
      }

      router.push('/equipment')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: mode === 'edit' ? 'Failed to update equipment' : 'Failed to create equipment',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'edit' ? 'Edit Equipment' : 'Create New Equipment'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Inventory Number and Name */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="inventory_number">Inventory Number *</Label>
              <Input
                {...register('inventory_number')}
                placeholder="e.g., INV-2024-001"
              />
              {errors.inventory_number && (
                <p className="text-sm text-red-500">{errors.inventory_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment_name">Equipment Name *</Label>
              <Input
                {...register('equipment_name')}
                placeholder="e.g., CT Scanner"
              />
              {errors.equipment_name && (
                <p className="text-sm text-red-500">{errors.equipment_name.message}</p>
              )}
            </div>
          </div>

          {/* Type and Model */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="equipment_type">Equipment Type *</Label>
              <Input
                {...register('equipment_type')}
                placeholder="e.g., Diagnostic, Imaging"
              />
              {errors.equipment_type && (
                <p className="text-sm text-red-500">{errors.equipment_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model_number">Model Number</Label>
              <Input
                {...register('model_number')}
                placeholder="e.g., GE LightSpeed"
              />
              {errors.model_number && (
                <p className="text-sm text-red-500">{errors.model_number.message}</p>
              )}
            </div>
          </div>

          {/* Serial and Manufacturer */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                {...register('serial_number')}
                placeholder="Serial number"
              />
              {errors.serial_number && (
                <p className="text-sm text-red-500">{errors.serial_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer_id">Manufacturer</Label>
              {loadingDropdowns ? (
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
              {errors.manufacturer_id && (
                <p className="text-sm text-red-500">{errors.manufacturer_id.message}</p>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="space-y-2">
            <Label htmlFor="_customer_id">Customer *</Label>
            {loadingDropdowns ? (
              <div className="p-2 text-gray-500">Loading customers...</div>
            ) : (
              <Controller
                name="_customer_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={(value) => {
                      field.onChange(value)
                      setValue('location_id', '')
                      fetchLocationsForCustomer(value || null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <div className="p-2 text-gray-500">No customers available</div>
                      ) : (
                        customers.map((cust) => (
                          <SelectItem key={cust.customer_id} value={cust.customer_id.toString()}>
                            {cust.customer_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </div>

          {/* Location and Status */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="location_id">Location</Label>
              {loadingLocations ? (
                <div className="p-2 text-gray-500">Loading locations...</div>
              ) : (
                <Controller
                  name="location_id"
                  control={control}
                  render={({ field }) => {
                    const currentCustomerId = getValues('_customer_id')
                    const isDisabled = !currentCustomerId || locations.length === 0
                    const placeholder = !currentCustomerId ? "Select a customer first" : locations.length === 0 ? "No locations available" : "Select location"

                    return (
                      <Select value={field.value || ''} onValueChange={field.onChange} disabled={isDisabled}>
                        <SelectTrigger>
                          <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.location_id} value={loc.location_id.toString()}>
                              {loc.department_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  }}
                />
              )}
              {errors.location_id && (
                <p className="text-sm text-red-500">{errors.location_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="Decommissioned">Decommissioned</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="installation_date">Installation Date</Label>
              <Input
                {...register('installation_date')}
                type="date"
              />
              {errors.installation_date && (
                <p className="text-sm text-red-500">{errors.installation_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                {...register('purchase_date')}
                type="date"
              />
              {errors.purchase_date && (
                <p className="text-sm text-red-500">{errors.purchase_date.message}</p>
              )}
            </div>
          </div>

          {/* Price and Warranty */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price</Label>
              <Input
                {...register('purchase_price')}
                placeholder="0.00"
                type="number"
                step="0.01"
              />
              {errors.purchase_price && (
                <p className="text-sm text-red-500">{errors.purchase_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
              <Input
                {...register('warranty_expiry')}
                type="date"
              />
              {errors.warranty_expiry && (
                <p className="text-sm text-red-500">{errors.warranty_expiry.message}</p>
              )}
            </div>
          </div>

          {/* Risk Level */}
          <div className="space-y-2">
            <Label htmlFor="risk_level">Risk Level</Label>
            <Controller
              name="risk_level"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.risk_level && (
              <p className="text-sm text-red-500">{errors.risk_level.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/equipment')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Equipment' : 'Create Equipment')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
