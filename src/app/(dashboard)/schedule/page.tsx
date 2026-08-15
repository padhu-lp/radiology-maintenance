'use client'

import { Card } from '@/components/ui/card'
import { MaintenanceCalendar } from '@/components/dashboard/maintenance-calendar'

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Maintenance Schedule</h1>
        <p className="text-gray-600">View upcoming maintenance tasks and schedules</p>
      </div>

      <Card className="p-6">
        <MaintenanceCalendar />
      </Card>
    </div>
  )
}
