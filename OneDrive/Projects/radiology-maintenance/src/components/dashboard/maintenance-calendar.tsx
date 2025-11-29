'use client'

import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'

interface MaintenanceEvent {
    date: Date
    title: string
    type: 'scheduled' | 'urgent'
}

interface MaintenanceCalendarProps {
    events?: MaintenanceEvent[]
}

export function MaintenanceCalendar({ events = [] }: MaintenanceCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setSelectedDate(new Date())
        setMounted(true)
    }, [])

    const datesWithEvents = events.map((event) => event.date)

    const selectedDateEvents = events.filter(
        (event) =>
            selectedDate &&
            event.date.toDateString() === selectedDate.toDateString()
    )

    if (!mounted) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Maintenance Calendar</CardTitle>
                    <CardDescription>
                        View scheduled maintenance and urgent services
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-80 bg-gray-50 animate-pulse" />
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Maintenance Calendar</CardTitle>
                <CardDescription>
                    View scheduled maintenance and urgent services
                </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-6">
                <div>
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border"
                        disabled={(date) => {
                            return !datesWithEvents.some(
                                (d) => d.toDateString() === date.toDateString()
                            )
                        }}
                    />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold mb-4">
                        {selectedDate?.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </h3>
                    {selectedDateEvents.length > 0 ? (
                        <div className="space-y-3">
                            {selectedDateEvents.map((event, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-md ${
                                        event.type === 'urgent'
                                            ? 'bg-red-50 border border-red-200'
                                            : 'bg-blue-50 border border-blue-200'
                                    }`}
                                >
                                    <p className="font-medium text-sm">{event.title}</p>
                                    <p className="text-xs text-gray-600 capitalize mt-1">
                                        {event.type}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">
                            No maintenance scheduled for this date
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
