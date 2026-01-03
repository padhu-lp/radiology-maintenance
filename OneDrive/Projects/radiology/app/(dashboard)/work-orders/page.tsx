'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Edit, Trash, Search, Calendar } from 'lucide-react'
import Link from 'next/link'

type WorkOrder = {
  workorder_id: string
  workorder_number: string
  equipment_id: string
  workorder_type: string
  priority: string
  requested_by?: string
  assigned_technician?: string
  problem_description?: string
  status: string
  request_date: string
  scheduled_date?: string
  completion_date?: string
  downtime_hours?: number
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  useEffect(() => {
    let filtered = workOrders

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter((wo) => wo.status === statusFilter)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (wo) =>
          wo.workorder_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wo.problem_description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredWorkOrders(filtered)
  }, [searchTerm, statusFilter, workOrders])

  const fetchWorkOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .order('request_date', { ascending: false })

      if (error) throw error
      setWorkOrders(data || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch work orders'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true)
      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('workorder_id', id)

      if (error) throw error

      setWorkOrders((prev) => prev.filter((wo) => wo.workorder_id !== id))
      toast({
        title: 'Success',
        description: 'Work order deleted successfully',
      })
      setDeleteId(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete work order'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency':
        return 'bg-red-100 text-red-800'
      case 'High':
        return 'bg-orange-100 text-orange-800'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'Low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800'
      case 'In Progress':
        return 'bg-purple-100 text-purple-800'
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Orders</h1>
          <p className="text-gray-600">Manage equipment maintenance work orders</p>
        </div>
        <Link href="/work-orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Work Order
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-4">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium mb-2">Search</label>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by work order number or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 focus:ring-0 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Work Orders</p>
          <p className="text-2xl font-bold">{workOrders.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Open</p>
          <p className="text-2xl font-bold text-blue-600">{workOrders.filter((wo) => wo.status === 'Open').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-purple-600">
            {workOrders.filter((wo) => wo.status === 'In Progress').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {workOrders.filter((wo) => wo.status === 'Completed').length}
          </p>
        </Card>
      </div>

      {/* Work Orders Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading work orders...</div>
        ) : filteredWorkOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No work orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Work Order #</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Priority</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Requested By</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Request Date</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkOrders.map((workOrder) => (
                  <tr key={workOrder.workorder_id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium">{workOrder.workorder_number}</td>
                    <td className="px-6 py-3 text-sm">{workOrder.workorder_type}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(workOrder.priority)}`}>
                        {workOrder.priority}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(workOrder.status)}`}>
                        {workOrder.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">{workOrder.requested_by || '-'}</td>
                    <td className="px-6 py-3 text-sm">
                      {new Date(workOrder.request_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm text-right space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(workOrder.workorder_id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Delete Work Order?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this work order? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
