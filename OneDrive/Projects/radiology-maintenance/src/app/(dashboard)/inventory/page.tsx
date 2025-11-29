'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

export default function InventoryPage() {
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
        .select('*')
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Parts Inventory</h1>
          <p className="text-gray-600">Manage spare parts and inventory</p>
        </div>
        <Button disabled><Plus className="mr-2 h-4 w-4" /> Add Part</Button>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-center py-8">Loading parts...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Minimum Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No parts found
                  </TableCell>
                </TableRow>
              ) : (
                parts.map((item) => (
                  <TableRow key={item.part_id}>
                    <TableCell className="font-medium">{item.part_number}</TableCell>
                    <TableCell>{item.part_name}</TableCell>
                    <TableCell>{item.category || '-'}</TableCell>
                    <TableCell>{item.current_stock}</TableCell>
                    <TableCell>{item.minimum_stock || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.current_stock <= (item.minimum_stock || 0) ? 'destructive' : 'default'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
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
