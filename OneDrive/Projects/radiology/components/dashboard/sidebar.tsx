'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Monitor,
    Wrench,
    Package,
    ClipboardList,
    FileText,
    Settings,
    Users,
    AlertTriangle,
    Calendar,
    BarChart3,
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Equipment', href: '/equipment', icon: Monitor },
    { name: 'Work Orders', href: '/work-orders', icon: ClipboardList },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench },
    { name: 'Parts Inventory', href: '/inventory', icon: Package },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
    { name: 'Technicians', href: '/technicians', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="w-64 bg-slate-900 text-white">
            <div className="p-6">
                <h1 className="text-xl font-bold">RadMaintain</h1>
                <p className="text-xs text-slate-400 mt-1">Equipment Management System</p>
            </div>

            <nav className="mt-6">
                {navigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center px-6 py-3 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <Icon className="mr-3 h-5 w-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}