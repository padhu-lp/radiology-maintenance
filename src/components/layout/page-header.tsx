import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  actions,
}: {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel ?? 'Back'}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}

/** Shown instead of an empty table, so a blank screen never looks like a bug. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-14 px-6">
      <p className="font-medium">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
