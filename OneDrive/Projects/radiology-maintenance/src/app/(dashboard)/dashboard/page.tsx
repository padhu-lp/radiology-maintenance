import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createServerClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { Activity, AlertCircle, CheckCircle, Clock, Wrench } from 'lucide-react'
import { EquipmentChart } from '@/components/dashboard/equipment-chart'
import { WorkOrderTable } from '@/components/dashboard/work-order-table'
import { MaintenanceCalendar } from '@/components/dashboard/maintenance-calendar'

export default async function DashboardPage() {
    const supabase = await createServerClient()

    // Fetch dashboard statistics
    const [
        { count: totalEquipment },
        { count: activeWorkOrders },
        { count: overdueMaintenances },
        { data: recentWorkOrders }
    ] = await Promise.all([
        supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('work_orders').select('*', { count: 'exact', head: true }).in('status', ['Open', 'In Progress']),
        supabase.from('schedules').select('*', { count: 'exact', head: true }).lte('next_due', new Date().toISOString()),
        supabase.from('work_orders').select('*, inventory(equipment_name)').order('request_date', { ascending: false }).limit(5)
    ])

    const stats = [
        {
            title: 'Total Equipment',
            value: totalEquipment || 0,
            icon: Activity,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Active Work Orders',
            value: activeWorkOrders || 0,
            icon: Wrench,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
        },
        {
            title: 'Overdue Maintenance',
            value: overdueMaintenances || 0,
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
        },
        {
            title: 'Completed Today',
            value: 12,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-gray-600">Welcome to Radiology Equipment Maintenance System</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    {stat.title}
                                </CardTitle>
                                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                                    <Icon className={cn('h-5 w-5', stat.color)} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Equipment Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <EquipmentChart />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Work Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <WorkOrderTable workOrders={recentWorkOrders || []} />
                    </CardContent>
                </Card>
            </div>

            {/* Maintenance Calendar */}
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Maintenance</CardTitle>
                </CardHeader>
                <CardContent>
                    <MaintenanceCalendar />
                </CardContent>
            </Card>
        </div>
    )
}