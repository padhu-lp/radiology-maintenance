'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUserRole } from '@/hooks/use-user-role'
import {
  LayoutDashboard, PhoneCall, ClipboardList, MonitorSmartphone, Building2,
  Package, FlaskConical, CalendarClock, Factory, Users, ShieldCheck, Activity, Truck,
} from 'lucide-react'

type Item = { name: string; href: string; icon: typeof LayoutDashboard; adminOnly?: boolean }

/**
 * Grouped rather than one flat list: daily work is separated from reference
 * data, which is what made the previous 12-item list hard to scan.
 */
const GROUPS: { label: string | null; items: Item[] }[] = [
  {
    label: null,
    items: [{ name: 'Overview', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Service',
    items: [
      { name: 'Service Requests', href: '/service-requests', icon: PhoneCall },
      { name: 'Work Orders',      href: '/work-orders',      icon: ClipboardList },
      { name: 'Schedules',        href: '/schedules',        icon: CalendarClock },
      { name: 'QC Tests',         href: '/qc-tests',         icon: FlaskConical },
    ],
  },
  {
    label: 'Assets',
    items: [
      { name: 'Equipment', href: '/equipment', icon: MonitorSmartphone },
      { name: 'Customers', href: '/customers', icon: Building2 },
      { name: 'Parts',     href: '/parts',     icon: Package },
    ],
  },
  {
    label: 'Setup',
    items: [
      { name: 'Manufacturers', href: '/manufacturers', icon: Factory },
      { name: 'Suppliers',     href: '/suppliers',     icon: Truck },
      { name: 'Technicians',   href: '/technicians',   icon: Users },
      { name: 'Activity Log',  href: '/activity',      icon: Activity, adminOnly: true },
      { name: 'Users',         href: '/admin/users',   icon: ShieldCheck, adminOnly: true },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isAdmin } = useUserRole()

  return (
    <aside className="w-60 shrink-0 border-r bg-slate-950 text-slate-300 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-blue-600 grid place-items-center text-white font-bold text-sm">
            R
          </div>
          <div className="leading-tight">
            <p className="text-white font-semibold">RadServe</p>
            <p className="text-[11px] text-slate-500">Equipment Service</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {GROUPS.map((group, gi) => {
          const visible = group.items.filter((i) => !i.adminOnly || isAdmin)
          if (visible.length === 0) return null

          return (
            <div key={group.label ?? `g${gi}`} className="mb-4">
              {group.label && (
                <p className="px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  {group.label}
                </p>
              )}
              {visible.map((item) => {
                const Icon = item.icon
                // Prefix match so /work-orders/<id> keeps the parent highlighted.
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-5 py-2 text-sm transition-colors',
                      active
                        ? 'bg-slate-900 text-white font-medium border-l-2 border-blue-500 pl-[18px]'
                        : 'hover:bg-slate-900/60 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
