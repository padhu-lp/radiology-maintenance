'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface WorkOrder {
  id?: string
  equipment_id?: string
  description?: string
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
  created_at?: string
  request_date?: string
}

interface WorkOrderTableProps {
  workOrders?: WorkOrder[]
}

function getStatusColor(status?: string) {
  switch (status) {
    case 'open':
    case 'Open':
      return 'bg-blue-100 text-blue-800'
    case 'in_progress':
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
    case 'Completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
    case 'Cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function WorkOrderTable({ workOrders = [] }: WorkOrderTableProps) {
  const orders = workOrders.length > 0 ? workOrders : [
    {
      id: '1',
      equipment_id: 'EQ001',
      description: 'Routine maintenance',
      status: 'in_progress' as const,
      created_at: '2024-11-01',
    },
  ]

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Equipment</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, i) => (
            <TableRow key={order.id || i}>
              <TableCell className="font-medium">{order.id || '-'}</TableCell>
              <TableCell>{order.equipment_id || '-'}</TableCell>
              <TableCell>{order.description || '-'}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(order.status as string)}>
                  {order.status || 'pending'}
                </Badge>
              </TableCell>
              <TableCell>{order.created_at || order.request_date || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
