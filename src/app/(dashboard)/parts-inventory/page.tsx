'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

export default function PartsInventoryPage() {
  const [parts, setParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchParts()
  }, [])

  const fetchParts = async () => {
    try {
      const { data, error } = await supabase
        .from('parts_inventory')
        .select('*, manufacturers(manufacturer_name)')
        .order('part_name', { ascending: true })

      if (error) throw error
      setParts(data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch parts inventory',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (partId: string) => {
    if (!confirm('Are you sure you want to delete this part?')) return

    try {
      const { error } = await supabase
        .from('parts_inventory')
        .delete()
        .eq('part_id', partId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Part deleted successfully',
      })
      fetchParts()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete part',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Parts Inventory</h1>
          <p className="text-gray-600">Manage spare parts and inventory levels</p>
        </div>
        <Link href="/parts-inventory/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Part</Button>
        </Link>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-center py-8">Loading parts...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Number</TableHead>
                <TableHead>Part Name</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Minimum Stock</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No parts found
                  </TableCell>
                </TableRow>
              ) : (
                parts.map((part) => (
                  <TableRow key={part.part_id}>
                    <TableCell className="font-medium">{part.part_number}</TableCell>
                    <TableCell>{part.part_name}</TableCell>
                    <TableCell>{part.manufacturers?.manufacturer_name || '-'}</TableCell>
                    <TableCell>{part.category || '-'}</TableCell>
                    <TableCell>{part.current_stock}</TableCell>
                    <TableCell>{part.minimum_stock || '-'}</TableCell>
                    <TableCell>${part.unit_cost ? part.unit_cost.toFixed(2) : '0.00'}</TableCell>
                    <TableCell>
                      <Badge variant={part.current_stock <= (part.minimum_stock || 0) ? 'destructive' : part.is_active ? 'default' : 'secondary'}>
                        {part.current_stock <= (part.minimum_stock || 0) ? 'Low Stock' : part.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Link href={`/parts-inventory/${part.part_id}/edit`}>
                        <Button size="sm">Edit</Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(part.part_id)}
                      >
                        Delete
                      </Button>
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
