'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CustomerForm } from '@/components/customers/customer-form'

type Customer = {
  customer_id: number
  customer_code: string
  customer_name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state_province?: string
  postal_code?: string
  country?: string
  is_active: boolean
}

export default function EditCustomerPage() {
  const params = useParams()
  const id = params.id as string
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('customer_id', parseInt(id))
          .single()

        if (error) throw error
        setCustomer(data)
      } catch (error) {
        console.error('Error fetching customer:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
  }, [id, supabase])

  if (loading) {
    return <div className="text-center py-8">Loading customer...</div>
  }

  if (!customer) {
    return <div className="text-center py-8 text-red-500">Customer not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Customer</h1>
        <p className="text-gray-600">Update customer information</p>
      </div>

      <CustomerForm initialData={customer} mode="edit" />
    </div>
  )
}
