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
import { X } from 'lucide-react'

const customerSchema = z.object({
  customer_code: z.string().min(1, 'Code is required').max(50),
  customer_name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  contact_name: z.string().max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state_province: z.string().max(100).optional().or(z.literal('')),
  postal_code: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

interface LocationInput {
  id: string
  facility_code: string
  department_name: string
}

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerFormProps {
  initialData?: CustomerFormData & { customer_id?: number }
  mode?: 'create' | 'edit'
}

export function CustomerForm({ initialData, mode = 'create' }: CustomerFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locations, setLocations] = useState<LocationInput[]>([])
  const [facilityCode, setFacilityCode] = useState('')
  const [departmentName, setDepartmentName] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: (initialData || {
      is_active: true,
    }) as any
  })

  const addLocation = () => {
    if (!facilityCode.trim() || !departmentName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both location code and name',
        variant: 'destructive',
      })
      return
    }

    const newLocation: LocationInput = {
      id: Date.now().toString(),
      facility_code: facilityCode,
      department_name: departmentName,
    }

    setLocations([...locations, newLocation])
    setFacilityCode('')
    setDepartmentName('')
  }

  const removeLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id))
  }

  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true)

    try {
      if (mode === 'edit' && initialData?.customer_id) {
        const { error: updateError } = await (supabase as any)
          .from('customers')
          .update(data)
          .eq('customer_id', initialData.customer_id)

        if (updateError) throw updateError

        // Delete old locations for this customer
        const { error: deleteError } = await (supabase as any)
          .from('locations')
          .delete()
          .eq('customer_id', initialData.customer_id)

        if (deleteError) throw deleteError

        // Create new locations
        if (locations.length > 0) {
          const locationsToInsert = locations.map(loc => ({
            facility_code: loc.facility_code,
            department_name: loc.department_name,
            customer_id: initialData.customer_id,
            is_active: true,
          }))

          const { error: insertError } = await (supabase as any)
            .from('locations')
            .insert(locationsToInsert)

          if (insertError) throw insertError
        }

        toast({
          title: 'Success',
          description: 'Customer updated successfully',
        })
      } else {
        const { data: createdCustomer, error: insertError } = await (supabase as any)
          .from('customers')
          .insert([data])
          .select('customer_id')

        if (insertError) throw insertError
        if (!createdCustomer || createdCustomer.length === 0) throw new Error('Failed to get customer ID')

        const customerId = createdCustomer[0].customer_id

        // Create locations for the new customer
        if (locations.length > 0) {
          const locationsToInsert = locations.map(loc => ({
            facility_code: loc.facility_code,
            department_name: loc.department_name,
            customer_id: customerId,
            is_active: true,
          }))

          const { error: locError } = await (supabase as any)
            .from('locations')
            .insert(locationsToInsert)

          if (locError) throw locError
        }

        toast({
          title: 'Success',
          description: 'Customer created successfully',
        })
      }

      router.push('/customers')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: mode === 'edit' ? 'Failed to update customer' : 'Failed to create customer',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'edit' ? 'Edit Customer' : 'Create New Customer'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Code and Name */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="customer_code">Code *</Label>
              <Input
                {...register('customer_code')}
                placeholder="e.g., CUST001"
              />
              {errors.customer_code && (
                <p className="text-sm text-red-500">{errors.customer_code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                {...register('customer_name')}
                placeholder="e.g., City Hospital"
              />
              {errors.customer_name && (
                <p className="text-sm text-red-500">{errors.customer_name.message}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-6">
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
          </div>

          {/* Email and City */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                {...register('email')}
                placeholder="contact@customer.com"
                type="email"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                {...register('city')}
                placeholder="City name"
              />
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* State and Postal Code */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="state_province">State/Province</Label>
              <Input
                {...register('state_province')}
                placeholder="State or province"
              />
              {errors.state_province && (
                <p className="text-sm text-red-500">{errors.state_province.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                {...register('postal_code')}
                placeholder="Postal code"
              />
              {errors.postal_code && (
                <p className="text-sm text-red-500">{errors.postal_code.message}</p>
              )}
            </div>
          </div>

          {/* Address and Country */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              {...register('address')}
              placeholder="Street address"
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              {...register('country')}
              placeholder="Country name"
            />
            {errors.country && (
              <p className="text-sm text-red-500">{errors.country.message}</p>
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

          {/* Locations */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <Label className="text-base font-semibold mb-4 block">Add Locations for this Customer</Label>

              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facility_code">Location Code</Label>
                    <Input
                      id="facility_code"
                      placeholder="e.g., LAB-01, DEPT-A"
                      value={facilityCode}
                      onChange={(e) => setFacilityCode(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department_name">Location Name</Label>
                    <Input
                      id="department_name"
                      placeholder="e.g., 2nd Floor Lab, Emergency Dept"
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addLocation}
                  className="w-full"
                >
                  + Add Location
                </Button>
              </div>

              {/* Display added locations */}
              {locations.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-sm font-medium">Added Locations:</Label>
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded"
                    >
                      <div>
                        <p className="font-medium text-sm">{location.facility_code}</p>
                        <p className="text-sm text-gray-600">{location.department_name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLocation(location.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/customers')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Customer' : 'Create Customer')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
