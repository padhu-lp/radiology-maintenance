/** Shared formatting. Keep display logic here so screens stay consistent. */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

/** Amounts are NUMERIC(12,2) in Postgres and arrive as number | string | null. */
export function money(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(n) ? INR.format(n) : '—'
}

export function date(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
}

/** "3 days ago", "in 2 weeks" — for due dates and activity feeds. */
export function relative(value: string | null | undefined): string {
  if (!value) return '—'
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return '—'

  const diffDays = Math.round((then - Date.now()) / 86_400_000)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (Math.abs(diffDays) < 31) return rtf.format(diffDays, 'day')
  if (Math.abs(diffDays) < 365) return rtf.format(Math.round(diffDays / 30), 'month')
  return rtf.format(Math.round(diffDays / 365), 'year')
}

export function fullName(
  p: { first_name?: string | null; last_name?: string | null } | null | undefined
): string {
  if (!p) return '—'
  return [p.first_name, p.last_name].filter(Boolean).join(' ') || '—'
}

/** Text shown when a value is missing, so screens don't render blank cells. */
export const DASH = '—'
