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
    Users,
    AlertTriangle,
    Calendar,
    BarChart3,
    Building2,
    Store,
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Equipment', href: '/equipment', icon: Monitor },
    { name: 'Manufacturers', href: '/manufacturers', icon: Building2 },
    { name: 'Customers', href: '/customers', icon: Store },
    { name: 'Work Orders', href: '/work-orders', icon: ClipboardList },
    { name: 'Technicians', href: '/technicians', icon: Users },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench },
    { name: 'Parts Inventory', href: '/parts-inventory', icon: Package },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="w-64 bg-slate-900 text-white">
            <div className="p-6">
                <h1 className="text-xl font-bold">BalRad</h1>
                <p className="text-xs text-slate-400 mt-1">Radiology Equipment Maintenanace Systems & Services</p>
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