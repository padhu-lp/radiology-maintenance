'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
  created_date: string
  manufacturers?: { manufacturer_name: string }
  locations?: { department_name: string }
}

export default function EquipmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select(`
            *,
            manufacturers (manufacturer_name),
            locations (department_name)
          `)
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Active': 'default',
      'Inactive': 'secondary',
      'Under Maintenance': 'destructive',
      'Decommissioned': 'outline',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getRiskBadge = (risk?: string) => {
    if (!risk) return '-'
    const variants: Record<string, 'destructive' | 'secondary' | 'default'> = {
      'HIGH': 'destructive',
      'MEDIUM': 'secondary',
      'LOW': 'default',
    }
    return <Badge variant={variants[risk] || 'default'}>{risk}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{equipment.equipment_name}</h1>
            <p className="text-gray-600">{equipment.inventory_number}</p>
          </div>
        </div>
        <Link href={`/equipment/${equipment.equipment_id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Equipment Type</p>
              <p className="font-medium">{equipment.equipment_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Manufacturer</p>
              <p className="font-medium">{equipment.manufacturers?.manufacturer_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">{equipment.locations?.department_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <div className="mt-1">{getStatusBadge(equipment.status)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Model Number</p>
              <p className="font-medium">{equipment.model_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Serial Number</p>
              <p className="font-medium">{equipment.serial_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Risk Level</p>
              <div className="mt-1">{getRiskBadge(equipment.risk_level)}</div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Installation Date</p>
              <p className="font-medium">{equipment.installation_date ? new Date(equipment.installation_date).toLocaleDateString() : '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Purchase Date</p>
              <p className="font-medium">{equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Purchase Price</p>
              <p className="font-medium">{equipment.purchase_price ? `$${equipment.purchase_price.toFixed(2)}` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Warranty Expiry</p>
              <p className="font-medium">{equipment.warranty_expiry ? new Date(equipment.warranty_expiry).toLocaleDateString() : '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Equipment ID</p>
              <p className="font-medium text-xs break-all">{equipment.equipment_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created Date</p>
              <p className="font-medium">{new Date(equipment.created_date).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
