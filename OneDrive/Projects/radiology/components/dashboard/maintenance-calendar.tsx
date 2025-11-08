'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export function MaintenanceCalendar() {
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Maintenance Schedule
        </CardTitle>
        <CardDescription>
          {monthName} {year}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, i) => (
              <div
                key={i}
                className="aspect-square flex items-center justify-center rounded border text-sm"
              >
                {day && (
                  <span className={day === currentDate.getDate() ? 'font-bold' : ''}>
                    {day}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
