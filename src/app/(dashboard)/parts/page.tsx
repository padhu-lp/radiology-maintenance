import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader, EmptyState } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, AlertTriangle } from 'lucide-react'
import { DASH, money } from '@/lib/format'
import { EQUIPMENT_TYPES, isOneOf } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

type Row = {
  part_id: string; part_code: string; part_number: string; part_name: string
  equipment_type: string | null; quantity_on_hand: number
  reorder_point: number | null; unit_cost: number | null
  unit_of_measure: string; storage_location: string | null; is_active: boolean
  manufacturers: { manufacturer_name: string } | null
  suppliers: { supplier_name: string } | null
}

export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; low?: string }>
}) {
  const { type, low } = await searchParams
  const supabase = await createServerClient()

  let query = supabase
    .from('parts_inventory')
    .select(`part_id, part_code, part_number, part_name, equipment_type,
             quantity_on_hand, reorder_point, unit_cost, unit_of_measure,
             storage_location, is_active,
             manufacturers(manufacturer_name), suppliers(supplier_name)`)
    .order('part_name')

  if (isOneOf(EQUIPMENT_TYPES, type)) query = query.eq('equipment_type', type)

  const { data, error } = await query
  let rows = (data ?? []) as unknown as Row[]

  // "At or below reorder level" compares two columns, which PostgREST cannot
  // express directly, so it is filtered here rather than in the query.
  const isLow = (r: Row) => r.reorder_point !== null && r.quantity_on_hand <= r.reorder_point
  const lowCount = rows.filter(isLow).length
  if (low === '1') rows = rows.filter(isLow)

  const href = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ type, low, ...next })) if (v) p.set(k, v)
    const qs = p.toString()
    return qs ? `/parts?${qs}` : '/parts'
  }

  const chip = (label: string, to: string, active: boolean) => (
    <Link key={to + label} href={to}
      className={`rounded-md px-2.5 py-1 text-xs ring-1 ring-inset transition-colors ${
        active ? 'bg-slate-900 text-white ring-slate-900'
               : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}`}>
      {label}
    </Link>
  )

  const totalValue = rows.reduce(
    (sum, r) => sum + (Number(r.unit_cost) || 0) * r.quantity_on_hand, 0
  )

  return (
    <>
      <PageHeader
        title="Parts"
        description="Spare parts catalogue and stock levels"
        actions={
          <Link href="/parts/new">
            <Button><Plus className="mr-2 h-4 w-4" />Add part</Button>
          </Link>
        }
      />

      {lowCount > 0 && low !== '1' && (
        <Card className="mb-4 border-amber-200 bg-amber-50/60">
          <CardContent className="py-3 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>{lowCount}</strong> part{lowCount === 1 ? ' is' : 's are'} at or below reorder level.
            </span>
            <Link href={href({ low: '1' })} className="ml-auto">
              <Button size="sm" variant="outline">Show only these</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground mr-1">Fits</span>
        {chip('All', href({ type: undefined }), !type)}
        {EQUIPMENT_TYPES.map((t) => chip(t, href({ type: t }), type === t))}
        {low === '1' && (
          <Link href={href({ low: undefined })} className="ml-2">
            <Button size="sm" variant="ghost" className="h-7 text-xs">Clear low-stock filter</Button>
          </Link>
        )}
      </div>

      <Card>
        {error ? (
          <EmptyState title="Could not load parts" description={error.message} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={type || low ? 'Nothing matches these filters' : 'No parts yet'}
            description={type || low ? 'Try clearing the filters above.' : 'Add your spare parts catalogue.'}
            action={type || low
              ? <Link href="/parts"><Button variant="outline">Clear filters</Button></Link>
              : <Link href="/parts/new"><Button>Add part</Button></Link>}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Part</TableHead>
                  <TableHead>Fits</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Reorder</TableHead>
                  <TableHead className="text-right">Unit cost</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.part_id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.part_code}</TableCell>
                    <TableCell className="font-medium">
                      {p.part_name}
                      <span className="block text-xs text-muted-foreground font-mono">
                        {p.part_number}
                        {p.manufacturers?.manufacturer_name && ` · ${p.manufacturers.manufacturer_name}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      {p.equipment_type
                        ? <StatusBadge value={p.equipment_type} />
                        : <span className="text-xs text-muted-foreground italic">generic</span>}
                    </TableCell>
                    <TableCell className="text-sm">{p.suppliers?.supplier_name ?? DASH}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={isLow(p) ? 'text-amber-700 font-semibold' : undefined}>
                        {p.quantity_on_hand}
                      </span>
                      <span className="text-xs text-muted-foreground"> {p.unit_of_measure}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {p.reorder_point ?? DASH}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(p.unit_cost)}</TableCell>
                    <TableCell>
                      <Link href={`/parts/${p.part_id}/edit`}>
                        <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-4 py-3 text-sm text-muted-foreground flex justify-between">
              <span>{rows.length} part{rows.length === 1 ? '' : 's'}</span>
              <span>Stock value <strong className="text-foreground">{money(totalValue)}</strong></span>
            </div>
          </>
        )}
      </Card>
    </>
  )
}
