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

export default async function ManufacturersPage() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('manufacturers')
    .select('*, equipment(count), parts_inventory(count)')
    .order('manufacturer_name')

  const rows = (data ?? []) as unknown as Array<{
    manufacturer_id: string; manufacturer_code: string; manufacturer_name: string
    contact_name: string | null; phone: string | null; email: string | null
    is_active: boolean
    equipment: { count: number }[]; parts_inventory: { count: number }[]
  }>

  return (
    <>
      <PageHeader
        title="Manufacturers"
        description="Equipment and spare part manufacturers"
        actions={
          <Link href="/manufacturers/new">
            <Button><Plus className="mr-2 h-4 w-4" />New manufacturer</Button>
          </Link>
        }
      />

      <Card>
        {error ? (
          <EmptyState title="Could not load manufacturers" description={error.message} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No manufacturers yet"
            description="Add manufacturers so you can attribute equipment and parts to them."
            action={<Link href="/manufacturers/new"><Button>Add manufacturer</Button></Link>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Equipment</TableHead>
                <TableHead className="text-right">Parts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.manufacturer_id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{m.manufacturer_code}</TableCell>
                  <TableCell className="font-medium">{m.manufacturer_name}</TableCell>
                  <TableCell>
                    {m.contact_name ?? DASH}
                    {m.phone && <span className="block text-xs text-muted-foreground">{m.phone}</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{m.equipment?.[0]?.count ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.parts_inventory?.[0]?.count ?? 0}</TableCell>
                  <TableCell><StatusBadge value={m.is_active ? 'Active' : 'Retired'} /></TableCell>
                  <TableCell>
                    <Link href={`/manufacturers/${m.manufacturer_id}/edit`}>
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
