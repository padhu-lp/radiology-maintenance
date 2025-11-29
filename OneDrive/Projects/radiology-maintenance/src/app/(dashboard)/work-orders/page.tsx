'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Eye } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

type WorkOrder = {
  workorder_id: string
  workorder_number: string
  equipment_id: string
  workorder_type: string
  priority: string
  status: string
  requested_by?: string
  request_date: string
  scheduled_date?: string
  start_date?: string
  completion_date?: string
  inventory?: {
    equipment_name: string
  }
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  const fetchWorkOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*, inventory(equipment_name)')
        .order('request_date', { ascending: false })

      if (error) throw error
      setWorkOrders(data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch work orders',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkOrders = workOrders.filter(item =>
    item.workorder_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inventory?.equipment_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Open': 'default',
      'In Progress': 'secondary',
      'Completed': 'outline',
      'On Hold': 'secondary',
      'Cancelled': 'destructive',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      'Emergency': 'destructive',
      'High': 'destructive',
      'Medium': 'secondary',
      'Low': 'default',
    }
    return <Badge variant={variants[priority] || 'default'}>{priority}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Work Orders</h1>
          <p className="text-gray-600">Manage equipment maintenance and repair work orders</p>
        </div>
        <Link href="/work-orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Work Order
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search work orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading work orders...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work Order #</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No work orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkOrders.map((item) => (
                  <TableRow key={item.workorder_id}>
                    <TableCell className="font-medium">{item.workorder_number}</TableCell>
                    <TableCell>{item.inventory?.equipment_name || '-'}</TableCell>
                    <TableCell>{item.workorder_type}</TableCell>
                    <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.requested_by || '-'}</TableCell>
                    <TableCell>{new Date(item.request_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/work-orders/${item.workorder_id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/work-orders/${item.workorder_id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
