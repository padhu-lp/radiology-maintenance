'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip
} from 'recharts'

const COLORS = {
    'Active': '#10b981',
    'Inactive': '#6b7280',
    'Under Maintenance': '#f59e0b',
    'Decommissioned': '#ef4444'
}

export function EquipmentChart() {
    const [data, setData] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        fetchEquipmentStatus()

        // Set up real-time subscription
        const channel = supabase
            .channel('equipment-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'inventory' },
                () => {
                    fetchEquipmentStatus()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchEquipmentStatus = async () => {
        const { data: equipment } = await supabase
            .from('inventory')
            .select('status') as { data: Array<{ status: string }> | null }

        if (equipment && equipment.length > 0) {
            const statusCounts = equipment.reduce((acc: any, item: any) => {
                acc[item.status] = (acc[item.status] || 0) + 1
                return acc
            }, {})

            const chartData = Object.entries(statusCounts).map(([status, count]) => ({
                name: status,
                value: count as number,
                color: COLORS[status as keyof typeof COLORS]
            }))

            setData(chartData)
        }
    }

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
                    label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
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