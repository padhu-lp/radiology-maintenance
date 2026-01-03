'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Equipment = {
  equipment_id: string
  inventory_number: string
  equipment_name: string
}

type Technician = {
  id: string
  name: string
}

export default function WorkOrderForm() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [formData, setFormData] = useState({
    workorder_number: '',
    equipment_id: '',
    workorder_type: 'Corrective',
    priority: 'Medium',
    requested_by: '',
    assigned_technician: '',
    service_provider: '',
    problem_description: '',
    fault_code: '',
    scheduled_date: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [equipmentRes, techniciansRes] = await Promise.all([
        supabase.from('inventory').select('equipment_id, inventory_number, equipment_name').order('equipment_name'),
        supabase.from('technicians').select('id, name').order('name'),
      ])

      if (equipmentRes.error) throw equipmentRes.error
      if (techniciansRes.error) throw techniciansRes.error

      setEquipment(equipmentRes.data || [])
      setTechnicians(techniciansRes.data || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch equipment and technicians'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      console.error('Fetch error:', error)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    console.log('handleSelectChange called for', name, 'with value', value) // Added for debugging
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      }
      console.log('Updated form data:', updated) // Added for debugging
      return updated
    })
  }

  const generateWorkOrderNumber = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `WO-${timestamp}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('Submitting form with data:', formData) // Added for debugging

    // Validation
    if (!formData.workorder_number || !formData.equipment_id) {
      toast({
        title: 'Validation Error',
        description: 'Work order number and equipment are required',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const payload = {
        workorder_number: formData.workorder_number,
        equipment_id: formData.equipment_id,
        workorder_type: formData.workorder_type,
        priority: formData.priority,
        requested_by: formData.requested_by || null,
        assigned_technician: formData.assigned_technician || null,
        service_provider: formData.service_provider || null,
        problem_description: formData.problem_description || null,
        fault_code: formData.fault_code || null,
        scheduled_date: formData.scheduled_date || null,
        request_date: new Date().toISOString(),
        status: 'Open',
      }

      const { error } = await supabase
        .from('work_orders')
        .insert([payload])

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Work order created successfully',
      })

      router.push('/work-orders')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create work order'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/work-orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Work Order</h1>
          <p className="text-gray-600">Create a new maintenance work order</p>
        </div>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Work Order Basic Info */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Work Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workorder_number">Work Order Number *</Label>
                <div className="flex gap-2">
                  <Input
                    id="workorder_number"
                    name="workorder_number"
                    placeholder="Auto-generate or enter manually"
                    value={formData.workorder_number}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const woNumber = generateWorkOrderNumber()
                      setFormData((prev) => ({ ...prev, workorder_number: woNumber }))
                    }}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment_id">Equipment *</Label>
                <Select value={formData.equipment_id} onValueChange={(value) => handleSelectChange('equipment_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={formData.equipment_id || "Select equipment"} />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((eq) => (
                      <SelectItem key={eq.equipment_id} value={eq.equipment_id}>
                        {eq.inventory_number} - {eq.equipment_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workorder_type">Work Order Type</Label>
                <Select value={formData.workorder_type} onValueChange={(value) => handleSelectChange('workorder_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Preventive">Preventive</SelectItem>
                    <SelectItem value="Corrective">Corrective</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Calibration">Calibration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Request Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requested_by">Requested By</Label>
                <Input
                  id="requested_by"
                  name="requested_by"
                  placeholder="Name of person requesting"
                  value={formData.requested_by}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Scheduled Date</Label>
                <Input
                  id="scheduled_date"
                  name="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fault_code">Fault Code</Label>
                <Input
                  id="fault_code"
                  name="fault_code"
                  placeholder="e.g., ERR-001"
                  value={formData.fault_code}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_provider">Service Provider</Label>
                <Input
                  id="service_provider"
                  name="service_provider"
                  placeholder="External service provider (if applicable)"
                  value={formData.service_provider}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="problem_description">Problem Description</Label>
              <Textarea
                id="problem_description"
                name="problem_description"
                placeholder="Describe the issue in detail"
                value={formData.problem_description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </div>

          {/* Assignment */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Assignment</h2>
            <div className="space-y-2">
              <Label htmlFor="assigned_technician">Assigned Technician</Label>
              <Select value={formData.assigned_technician} onValueChange={(value) => handleSelectChange('assigned_technician', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 justify-end pt-6 border-t">
            <Link href="/work-orders">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating Work Order...' : 'Create Work Order'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
