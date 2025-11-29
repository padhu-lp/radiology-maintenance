'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download, Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function MaintenanceHistoryReport() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchMaintenanceHistory()
  }, [])

  const fetchMaintenanceHistory = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('schedules')
        .select('*, inventory(equipment_name)')
        .order('last_performed', { ascending: false, nullsFirst: false })

      if (startDate) {
        query = query.gte('last_performed', startDate)
      }
      if (endDate) {
        query = query.lte('last_performed', endDate)
      }

      const { data, error } = await query

      if (error) throw error
      setSchedules(data || [])
    } catch (error) {
      console.error('Error fetching maintenance history:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch maintenance history',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    fetchMaintenanceHistory()
  }

  const exportToCSV = () => {
    if (schedules.length === 0) {
      toast({
        title: 'Warning',
        description: 'No data to export',
        variant: 'destructive',
      })
      return
    }

    const headers = ['Equipment', 'Maintenance Type', 'Frequency', 'Last Performed', 'Next Due', 'Status']
    const rows = schedules.map((schedule) => [
      schedule.inventory?.equipment_name || '-',
      schedule.maintenance_type || '-',
      schedule.frequency || '-',
      schedule.last_performed ? new Date(schedule.last_performed).toLocaleDateString() : '-',
      schedule.next_due ? new Date(schedule.next_due).toLocaleDateString() : '-',
      new Date(schedule.next_due) < new Date() ? 'Overdue' : 'Scheduled',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `maintenance-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Maintenance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
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

      <Card>
        <CardHeader>
          <CardTitle>Maintenance History</CardTitle>
          <p className="text-sm text-gray-600 mt-2">Total Records: {schedules.length}</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading maintenance history...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Maintenance Type</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Last Performed</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No maintenance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedules.map((schedule) => (
                      <TableRow key={schedule.schedule_id}>
                        <TableCell className="font-medium">
                          {schedule.inventory?.equipment_name || '-'}
                        </TableCell>
                        <TableCell>{schedule.maintenance_type || '-'}</TableCell>
                        <TableCell>{schedule.frequency || '-'}</TableCell>
                        <TableCell>
                          {schedule.last_performed
                            ? new Date(schedule.last_performed).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(schedule.next_due).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              new Date(schedule.next_due) < new Date() ? 'destructive' : 'default'
                            }
                          >
                            {new Date(schedule.next_due) < new Date() ? 'Overdue' : 'Scheduled'}
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
