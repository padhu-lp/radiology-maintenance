'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EquipmentForm } from '@/components/equipment/equipment-form'

type Equipment = {
  equipment_id: string
  inventory_number: string
  equipment_name: string
  equipment_type: string
  manufacturer_id?: number
  location_id?: number
  serial_number?: string
  model_number?: string
  installation_date?: string
  purchase_date?: string
  purchase_price?: number
  warranty_expiry?: string
  risk_level?: string
  status: string
}

export default function EditEquipmentPage() {
  const params = useParams()
  const id = params.id as string
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .eq('equipment_id', id)
          .single()

        if (error) throw error
        setEquipment(data)
      } catch (error) {
        console.error('Error fetching equipment:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEquipment()
  }, [id, supabase])

  if (loading) {
    return <div className="text-center py-8">Loading equipment...</div>
  }

  if (!equipment) {
    return <div className="text-center py-8 text-red-500">Equipment not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Equipment</h1>
        <p className="text-gray-600">Update equipment information</p>
      </div>

      <div className="max-w-4xl">
        <EquipmentForm initialData={equipment as any} mode="edit" />
      </div>
    </div>
  )
}
