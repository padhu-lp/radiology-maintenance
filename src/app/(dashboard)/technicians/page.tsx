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

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchTechnicians()
  }, [])

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('last_name', { ascending: true })

      if (error) throw error
      setTechnicians(data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch technicians',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (technicianId: string) => {
    if (!confirm('Are you sure you want to delete this technician?')) return

    try {
      const { error } = await supabase
        .from('technicians')
        .delete()
        .eq('technician_id', technicianId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Technician deleted successfully',
      })
      fetchTechnicians()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete technician',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Technicians</h1>
          <p className="text-gray-600">Manage technician team and assignments</p>
        </div>
        <Link href="/technicians/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Technician</Button>
        </Link>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-center py-8">Loading technicians...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Certification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No technicians found
                  </TableCell>
                </TableRow>
              ) : (
                technicians.map((tech) => (
                  <TableRow key={tech.technician_id}>
                    <TableCell className="font-medium">{tech.technician_code}</TableCell>
                    <TableCell>{`${tech.first_name} ${tech.last_name}`}</TableCell>
                    <TableCell>{tech.email || '-'}</TableCell>
                    <TableCell>{tech.phone || '-'}</TableCell>
                    <TableCell>{tech.specialization || '-'}</TableCell>
                    <TableCell>{tech.certification || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={tech.is_active ? 'default' : 'secondary'}>
                        {tech.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Link href={`/technicians/${tech.technician_id}/edit`}>
                        <Button size="sm">Edit</Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(tech.technician_id)}
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
