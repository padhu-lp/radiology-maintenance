import { cn } from '@/lib/utils'

/**
 * Colour is meaning here, so the mapping lives in one place rather than being
 * re-derived in every table. Anything unmapped falls back to neutral grey
 * instead of throwing or rendering invisibly.
 */
const TONE: Record<string, string> = {
  // Work order / service request status
  'Open':               'bg-blue-50 text-blue-700 ring-blue-600/20',
  'New':                'bg-blue-50 text-blue-700 ring-blue-600/20',
  'Triaged':            'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  'In Progress':        'bg-amber-50 text-amber-800 ring-amber-600/20',
  'On Hold':            'bg-orange-50 text-orange-800 ring-orange-600/20',
  'Completed':          'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Resolved':           'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Converted':          'bg-violet-50 text-violet-700 ring-violet-600/20',
  'Cancelled':          'bg-slate-100 text-slate-600 ring-slate-500/20',

  // Priority / urgency / risk
  'Emergency':          'bg-red-50 text-red-700 ring-red-600/20',
  'Critical':           'bg-red-50 text-red-700 ring-red-600/20',
  'High':               'bg-orange-50 text-orange-800 ring-orange-600/20',
  'Medium':             'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  'Low':                'bg-slate-100 text-slate-600 ring-slate-500/20',

  // Equipment status
  'Active':             'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Under Maintenance':  'bg-amber-50 text-amber-800 ring-amber-600/20',
  'Out of Service':     'bg-red-50 text-red-700 ring-red-600/20',
  'Retired':            'bg-slate-100 text-slate-600 ring-slate-500/20',

  // QC
  'Pass':               'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Fail':               'bg-red-50 text-red-700 ring-red-600/20',
  'Conditional':        'bg-amber-50 text-amber-800 ring-amber-600/20',
}

export function StatusBadge({ value, className }: { value?: string | null; className?: string }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        TONE[value] ?? 'bg-slate-100 text-slate-600 ring-slate-500/20',
        className
      )}
    >
      {value}
    </span>
  )
}
