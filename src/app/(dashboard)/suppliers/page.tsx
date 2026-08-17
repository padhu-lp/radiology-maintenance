import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader, EmptyState } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil } from 'lucide-react'
import { DASH } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function SuppliersPage() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('suppliers')
    .select('*, parts_inventory(count)')
    .order('supplier_name')

  const rows = (data ?? []) as unknown as Array<{
    supplier_id: string; supplier_code: string; supplier_name: string
    contact_name: string | null; phone: string | null; email: string | null
    city: string | null; lead_time_days: number | null; is_active: boolean
    parts_inventory: { count: number }[]
  }>

  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Who you buy parts from — distinct from who manufactured them"
        actions={
          <Link href="/suppliers/new">
            <Button><Plus className="mr-2 h-4 w-4" />Add supplier</Button>
          </Link>
        }
      />

      <Card>
        {error ? (
          <EmptyState title="Could not load suppliers" description={error.message} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No suppliers yet"
            description="Add the companies you order spare parts from."
            action={<Link href="/suppliers/new"><Button>Add supplier</Button></Link>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Lead time</TableHead>
                <TableHead className="text-right">Parts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.supplier_id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.supplier_code}</TableCell>
                  <TableCell className="font-medium">{s.supplier_name}</TableCell>
                  <TableCell className="text-sm">
                    {s.contact_name ?? DASH}
                    {s.phone && <span className="block text-xs text-muted-foreground">{s.phone}</span>}
                  </TableCell>
                  <TableCell>{s.city ?? DASH}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.lead_time_days === null ? DASH : `${s.lead_time_days} d`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.parts_inventory?.[0]?.count ?? 0}
                  </TableCell>
                  <TableCell><StatusBadge value={s.is_active ? 'Active' : 'Retired'} /></TableCell>
                  <TableCell>
                    <Link href={`/suppliers/${s.supplier_id}/edit`}>
                      <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  )
}
