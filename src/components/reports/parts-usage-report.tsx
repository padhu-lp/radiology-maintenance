'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function PartsUsageReport() {
  const [parts, setParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchParts()
    fetchCategories()
  }, [])

  const fetchParts = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('parts_inventory')
        .select('*, manufacturers(manufacturer_name)')
        .order('part_name', { ascending: true })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      setParts(data || [])
    } catch (error) {
      console.error('Error fetching parts:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch parts data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('parts_inventory')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error

      const uniqueCategories = Array.from(
        new Set(((data as Array<{ category: string | null }>) || []).map((p) => p.category).filter(Boolean))
      ) as string[]
      setCategories(uniqueCategories.sort())
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
  }

  const handleFilter = () => {
    fetchParts()
  }

  const calculateTotalValue = () => {
    return parts.reduce((sum, part) => sum + ((part.unit_cost || 0) * part.current_stock), 0)
  }

  const exportToCSV = () => {
    if (parts.length === 0) {
      toast({
        title: 'Warning',
        description: 'No data to export',
        variant: 'destructive',
      })
      return
    }

    const headers = [
      'Part Number',
      'Part Name',
      'Manufacturer',
      'Category',
      'Current Stock',
      'Minimum Stock',
      'Unit Cost',
      'Total Value',
      'Status',
    ]
    const rows = parts.map((part) => [
      part.part_number || '-',
      part.part_name || '-',
      part.manufacturers?.manufacturer_name || '-',
      part.category || '-',
      part.current_stock || 0,
      part.minimum_stock || 0,
      part.unit_cost ? `$${part.unit_cost.toFixed(2)}` : '$0.00',
      `$${((part.unit_cost || 0) * part.current_stock).toFixed(2)}`,
      part.current_stock <= (part.minimum_stock || 0) ? 'Low Stock' : part.is_active ? 'Active' : 'Inactive',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `parts-usage-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const lowStockParts = parts.filter((p) => p.current_stock <= (p.minimum_stock || 0))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Parts Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} className="w-full">
                Filter
              </Button>
              <Button onClick={exportToCSV} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {lowStockParts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800">
              {lowStockParts.length} part(s) are below minimum stock level. Consider reordering.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Parts Inventory Usage</CardTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Total Parts</p>
              <p className="text-2xl font-bold">{parts.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Low Stock Parts</p>
              <p className="text-2xl font-bold text-orange-600">{lowStockParts.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Total Inventory Value</p>
              <p className="text-2xl font-bold">${calculateTotalValue().toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Active Parts</p>
              <p className="text-2xl font-bold">{parts.filter((p) => p.is_active).length}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading parts data...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Part Name</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Status</TableHead>
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
                          ${((part.unit_cost || 0) * part.current_stock).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              part.current_stock <= (part.minimum_stock || 0)
                                ? 'destructive'
                                : part.is_active
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {part.current_stock <= (part.minimum_stock || 0)
                              ? 'Low Stock'
                              : part.is_active
                                ? 'Active'
                                : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
