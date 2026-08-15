'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, AlertTriangle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const { data: overdue } = await supabase
        .from('schedules')
        .select('*, inventory(equipment_name)')
        .lte('next_due', new Date().toISOString())

      const { data: warranty } = await supabase
        .from('inventory')
        .select('*')
        .lte('warranty_expiry', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .gt('warranty_expiry', new Date().toISOString())

      const combinedAlerts: any[] = []

      if (overdue && Array.isArray(overdue)) {
        overdue.forEach((s: any) => {
          combinedAlerts.push({
            id: 'overdue-' + s.schedule_id,
            type: 'overdue',
            title: `Overdue Maintenance: ${s.inventory?.equipment_name}`,
            description: `${s.maintenance_type} is overdue since ${new Date(s.next_due).toLocaleDateString()}`,
            severity: 'high'
          })
        })
      }

      if (warranty && Array.isArray(warranty)) {
        warranty.forEach((w: any) => {
          combinedAlerts.push({
            id: 'warranty-' + w.equipment_id,
            type: 'warranty',
            title: `Warranty Expiring: ${w.equipment_name}`,
            description: `Warranty expires on ${new Date(w.warranty_expiry).toLocaleDateString()}`,
            severity: 'medium'
          })
        })
      }

      setAlerts(combinedAlerts)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alerts & Notifications</h1>
        <p className="text-gray-600">System alerts and important notifications</p>
      </div>

      {loading ? (
        <Card className="p-6 text-center">Loading alerts...</Card>
      ) : alerts.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">No active alerts</Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="p-4 border-l-4" style={{
              borderLeftColor: alert.severity === 'high' ? '#ef4444' : '#f59e0b'
            }}>
              <div className="flex items-start gap-4">
                <div>
                  {alert.severity === 'high' ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{alert.title}</h3>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
