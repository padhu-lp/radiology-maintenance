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
import { Plus, Search, Filter, Download, Edit, Eye } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

type Equipment = {
    equipment_id: string
    inventory_number: string
    equipment_name: string
    equipment_type: string
    status: string
    risk_level: string
    warranty_expiry: string
    manufacturers?: {
        manufacturer_name: string
    }
    locations?: {
        department_name: string
        room_number: string
    }
}

export default function EquipmentPage() {
    const [equipment, setEquipment] = useState<Equipment[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const supabase = createClient()
    const { toast } = useToast()

    useEffect(() => {
        fetchEquipment()
    }, [])

    const fetchEquipment = async () => {
        try {
            const { data, error } = await supabase
                .from('inventory')
                .select(`
          *,
          manufacturers (manufacturer_name),
          locations (department_name, room_number)
        `)
                .order('created_date', { ascending: false })

            if (error) throw error
            setEquipment(data || [])
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch equipment'
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            })
            console.error('Fetch equipment error:', error)
        } finally {
            setLoading(false)
        }
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

    const getRiskBadge = (risk: string) => {
        const variants: Record<string, 'destructive' | 'secondary' | 'default'> = {
            'HIGH': 'destructive',
            'MEDIUM': 'secondary',
            'LOW': 'default',
        }
        return <Badge variant={variants[risk] || 'default'}>{risk}</Badge>
    }

    const filteredEquipment = equipment.filter(item =>
        item.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventory_number.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Equipment Inventory</h1>
                    <p className="text-gray-600">Manage and monitor all medical equipment</p>
                </div>
                <Link href="/equipment/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Equipment
                    </Button>
                </Link>
            </div>

            <Card className="p-6">
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search equipment..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                    </Button>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center py-8">Loading equipment...</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Inventory #</TableHead>
                                <TableHead>Equipment Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Manufacturer</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Risk Level</TableHead>
                                <TableHead>Warranty</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEquipment.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                        No equipment found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEquipment.map((item) => (
                                    <TableRow key={item.equipment_id}>
                                        <TableCell className="font-medium">{item.inventory_number}</TableCell>
                                        <TableCell>{item.equipment_name}</TableCell>
                                        <TableCell>{item.equipment_type}</TableCell>
                                        <TableCell>{item.manufacturers?.manufacturer_name || '-'}</TableCell>
                                        <TableCell>
                                            {item.locations ?
                                                `${item.locations.department_name} - ${item.locations.room_number}` :
                                                '-'
                                            }
                                        </TableCell>
                                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                                        <TableCell>{item.risk_level && getRiskBadge(item.risk_level)}</TableCell>
                                        <TableCell>
                                            {item.warranty_expiry
                                                ? new Date(item.warranty_expiry).toLocaleDateString()
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Link href={`/equipment/${item.equipment_id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/equipment/${item.equipment_id}/edit`}>
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