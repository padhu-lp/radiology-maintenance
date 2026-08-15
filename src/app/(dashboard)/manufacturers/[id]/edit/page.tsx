'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ManufacturerForm } from '@/components/manufacturers/manufacturer-form'

type Manufacturer = {
  manufacturer_id: number
  manufacturer_code: string
  manufacturer_name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
  website?: string
  is_active: boolean
}

export default function EditManufacturerPage() {
  const params = useParams()
  const id = params.id as string
  const [manufacturer, setManufacturer] = useState<Manufacturer | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchManufacturer = async () => {
      try {
        const { data, error } = await supabase
          .from('manufacturers')
          .select('*')
          .eq('manufacturer_id', parseInt(id))
          .single()

        if (error) throw error
        setManufacturer(data)
      } catch (error) {
        console.error('Error fetching manufacturer:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchManufacturer()
  }, [id, supabase])

  if (loading) {
    return <div className="text-center py-8">Loading manufacturer...</div>
  }

  if (!manufacturer) {
    return <div className="text-center py-8 text-red-500">Manufacturer not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Manufacturer</h1>
        <p className="text-gray-600">Update manufacturer information</p>
      </div>

      <ManufacturerForm initialData={manufacturer} mode="edit" />
    </div>
  )
}
