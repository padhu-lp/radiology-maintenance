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

type Manufacturer = {
  manufacturer_id: number
  manufacturer_code: string
  manufacturer_name: string
  contact_name?: string
  phone?: string
  email?: string
  website?: string
  is_active: boolean
  created_date: string
}

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchManufacturers()
  }, [])

  const fetchManufacturers = async () => {
    try {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('*')
        .order('manufacturer_name', { ascending: true })

      if (error) throw error
      setManufacturers(data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch manufacturers',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredManufacturers = manufacturers.filter(item =>
    item.manufacturer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.manufacturer_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manufacturers</h1>
          <p className="text-gray-600">Manage equipment manufacturers and suppliers</p>
        </div>
        <Link href="/manufacturers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Manufacturer
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search manufacturers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading manufacturers...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredManufacturers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No manufacturers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredManufacturers.map((item) => (
                  <TableRow key={item.manufacturer_id}>
                    <TableCell className="font-medium">{item.manufacturer_code}</TableCell>
                    <TableCell>{item.manufacturer_name}</TableCell>
                    <TableCell>{item.contact_name || '-'}</TableCell>
                    <TableCell>{item.phone || '-'}</TableCell>
                    <TableCell>{item.email || '-'}</TableCell>
                    <TableCell>
                      {item.website ? (
                        <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/manufacturers/${item.manufacturer_id}/edit`}>
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
