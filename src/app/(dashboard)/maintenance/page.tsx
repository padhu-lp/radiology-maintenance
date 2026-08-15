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

export default function MaintenancePage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*, inventory(equipment_name)')
        .order('next_due', { ascending: true })

      if (error) throw error
      setSchedules(data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch maintenance schedules',
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
          <h1 className="text-3xl font-bold">Maintenance Schedules</h1>
          <p className="text-gray-600">Manage equipment maintenance schedules</p>
        </div>
        <Link href="/maintenance/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New Schedule</Button>
        </Link>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-center py-8">Loading schedules...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment</TableHead>
                <TableHead>Maintenance Type</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead>Last Performed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No schedules found
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((item) => (
                  <TableRow key={item.schedule_id}>
                    <TableCell className="font-medium">{item.inventory?.equipment_name || '-'}</TableCell>
                    <TableCell>{item.maintenance_type}</TableCell>
                    <TableCell>{item.frequency}</TableCell>
                    <TableCell>{new Date(item.next_due).toLocaleDateString()}</TableCell>
                    <TableCell>{item.last_performed ? new Date(item.last_performed).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={new Date(item.next_due) < new Date() ? 'destructive' : 'default'}>
                        {new Date(item.next_due) < new Date() ? 'Overdue' : 'Scheduled'}
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
