import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader, EmptyState } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { DASH } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const supabase = await createServerClient()

  // Counts come from the embedded relations rather than N+1 queries.
  const { data, error } = await supabase
    .from('customers')
    .select('*, locations(count), equipment(count)')
    .order('customer_name')

  const customers = (data ?? []) as unknown as Array<
    Record<string, unknown> & {
      customer_id: string; customer_code: string; customer_name: string
      contact_name: string | null; city: string | null; phone: string | null
      is_active: boolean
      locations: { count: number }[]; equipment: { count: number }[]
    }
  >

  return (
    <>
      <PageHeader
        title="Customers"
        description="Hospitals, clinics and diagnostic centres you service"
        actions={
          <Link href="/customers/new">
            <Button><Plus className="mr-2 h-4 w-4" />New customer</Button>
          </Link>
        }
      />

      <Card>
        {error ? (
          <EmptyState title="Could not load customers" description={error.message} />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers yet"
            description="Add your first customer to start registering equipment against them."
            action={<Link href="/customers/new"><Button>Add customer</Button></Link>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Sites</TableHead>
                <TableHead className="text-right">Equipment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.customer_id} className="cursor-pointer">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <Link href={`/customers/${c.customer_id}`} className="block">{c.customer_code}</Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/customers/${c.customer_id}`} className="block hover:underline">
                      {c.customer_name}
                    </Link>
                  </TableCell>
                  <TableCell>{c.contact_name ?? DASH}</TableCell>
                  <TableCell>{c.city ?? DASH}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.locations?.[0]?.count ?? 0}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.equipment?.[0]?.count ?? 0}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={c.is_active ? 'Active' : 'Retired'} />
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
