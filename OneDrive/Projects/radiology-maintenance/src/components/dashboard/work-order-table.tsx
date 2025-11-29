'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

interface WorkOrder {
    workorder_id: string
    equipment_id: string
    workorder_type: string
    status: string
    assigned_technician?: string
    request_date: string
    scheduled_date?: string
    inventory?: { equipment_name: string }
}

interface WorkOrderTableProps {
    workOrders?: WorkOrder[]
}

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'pending':
            return 'secondary'
        case 'in_progress':
            return 'default'
        case 'completed':
            return 'outline'
        default:
            return 'secondary'
    }
}

export function WorkOrderTable({ workOrders = [] }: WorkOrderTableProps) {
    return (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50">
                        <TableHead>Equipment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {workOrders.length > 0 ? (
                        workOrders.map((order) => (
                            <TableRow key={order.workorder_id}>
                                <TableCell className="font-medium">{order.inventory?.equipment_name || '-'}</TableCell>
                                <TableCell>{order.workorder_type || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(order.status)}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{order.assigned_technician || '-'}</TableCell>
                                <TableCell>{new Date(order.request_date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                No work orders found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
