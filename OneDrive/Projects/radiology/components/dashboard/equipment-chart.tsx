'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip
} from 'recharts'

const COLORS: Record<string, string> = {
    'Active': '#10b981',
    'Inactive': '#6b7280',
    'Under Maintenance': '#f59e0b',
    'Decommissioned': '#ef4444'
}

interface ChartDataPoint extends Record<string, unknown> {
    name: string
    value: number
    color: string
}

export function EquipmentChart() {
    const [data, setData] = useState<ChartDataPoint[]>([])
    const supabase = createClient()

    const fetchEquipmentStatus = useCallback(async () => {
        const { data: equipment } = await supabase
            .from('inventory')
            .select('status')

        if (equipment) {
            const statusCounts = equipment.reduce<Record<string, number>>((acc, item) => {
                const status = (item as any).status
                acc[status] = (acc[status] || 0) + 1
                return acc
            }, {})

            const chartData = Object.entries(statusCounts).map(([status, count]) => ({
                name: status,
                value: count,
                color: COLORS[status] || '#9ca3af'
            }))

            setData(chartData)
        }
    }, [supabase])

    useEffect(() => {
        fetchEquipmentStatus()

        // Set up real-time subscription
        const channel = supabase
            .channel('equipment-changes')
            .on('postgres_changes',
                { event: '*', schema: 'equipment', table: 'inventory' },
                () => {
                    fetchEquipmentStatus()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, fetchEquipmentStatus])

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )
}