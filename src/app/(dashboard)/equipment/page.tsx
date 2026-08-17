import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader, EmptyState } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { DASH, date } from '@/lib/format'
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES, isOneOf } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

type Row = {
  equipment_id: string; equipment_code: string; equipment_name: string
  equipment_type: string; status: string; serial_number: string | null
  warranty_expiry: string | null
  customers: { customer_name: string } | null
  locations: { department_name: string } | null
  manufacturers: { manufacturer_name: string } | null
}

/** Filters live in the URL so a filtered view can be linked and shared. */
export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>
}) {
  const { type, status } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .from('equipment')
    .select(`equipment_id, equipment_code, equipment_name, equipment_type, status,
             serial_number, warranty_expiry,
             customers(customer_name), locations(department_name), manufacturers(manufacturer_name)`)
    .order('equipment_name')

  // Guards, not casts: an unknown ?type= in the URL is ignored rather than
  // being sent to Postgres where it would match nothing.
  if (isOneOf(EQUIPMENT_TYPES, type)) query = query.eq('equipment_type', type)
  if (isOneOf(EQUIPMENT_STATUSES, status)) query = query.eq('status', status)

  const { data, error } = await query
  const rows = (data ?? []) as unknown as Row[]

  const chip = (label: string, href: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`rounded-md px-2.5 py-1 text-xs ring-1 ring-inset transition-colors ${
        active
          ? 'bg-slate-900 text-white ring-slate-900'
          : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </Link>
  )

  const base = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const merged = { type, status, ...next }
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    const qs = p.toString()
    return qs ? `/equipment?${qs}` : '/equipment'
  }

  return (
    <>
      <PageHeader
        title="Equipment"
        description="Installed base across all customers"
        actions={
          <Link href="/equipment/new">
            <Button><Plus className="mr-2 h-4 w-4" />Register equipment</Button>
          </Link>
        }
      />

      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1 w-12">Type</span>
          {chip('All', base({ type: undefined }), !type)}
          {EQUIPMENT_TYPES.map((t) => chip(t, base({ type: t }), type === t))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1 w-12">Status</span>
          {chip('All', base({ status: undefined }), !status)}
          {EQUIPMENT_STATUSES.map((s) => chip(s, base({ status: s }), status === s))}
        </div>
      </div>

      <Card>
        {error ? (
          <EmptyState title="Could not load equipment" description={error.message} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={type || status ? 'No equipment matches these filters' : 'No equipment registered'}
            description={
              type || status
                ? 'Try clearing the filters above.'
                : 'Register your first machine. You will need a customer to attach it to.'
            }
            action={
              type || status
                ? <Link href="/equipment"><Button variant="outline">Clear filters</Button></Link>
                : <Link href="/equipment/new"><Button>Register equipment</Button></Link>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Warranty</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.equipment_id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {e.equipment_code}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/equipment/${e.equipment_id}`} className="hover:underline">
                      {e.equipment_name}
                    </Link>
                    {e.manufacturers?.manufacturer_name && (
                      <span className="block text-xs text-muted-foreground">
                        {e.manufacturers.manufacturer_name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{e.equipment_type}</TableCell>
                  <TableCell>{e.customers?.customer_name ?? DASH}</TableCell>
                  <TableCell>{e.locations?.department_name ?? DASH}</TableCell>
                  <TableCell className="whitespace-nowrap">{date(e.warranty_expiry)}</TableCell>
                  <TableCell><StatusBadge value={e.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  )
}
