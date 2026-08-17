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

export default async function TechniciansPage() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('technicians')
    .select('*, workorder_technicians(count)')
    .order('first_name')

  const rows = (data ?? []) as unknown as Array<{
    technician_id: string; technician_code: string
    first_name: string; last_name: string
    email: string | null; phone: string | null
    specialization: string | null; certification: string | null
    is_active: boolean
    workorder_technicians: { count: number }[]
  }>

  return (
    <>
      <PageHeader
        title="Technicians"
        description="Field engineers available for work order assignment"
        actions={
          <Link href="/technicians/new">
            <Button><Plus className="mr-2 h-4 w-4" />Add technician</Button>
          </Link>
        }
      />

      <Card>
        {error ? (
          <EmptyState title="Could not load technicians" description={error.message} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No technicians yet"
            description="Add your field engineers so they can be assigned to work orders."
            action={<Link href="/technicians/new"><Button>Add technician</Button></Link>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Specialisation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Jobs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.technician_id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {t.technician_code}
                  </TableCell>
                  <TableCell className="font-medium">
                    {t.first_name} {t.last_name}
                    {t.certification && (
                      <span className="block text-xs text-muted-foreground">{t.certification}</span>
                    )}
                  </TableCell>
                  <TableCell>{t.specialization ?? DASH}</TableCell>
                  <TableCell className="text-sm">
                    {t.email ?? DASH}
                    {t.phone && <span className="block text-xs text-muted-foreground">{t.phone}</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t.workorder_technicians?.[0]?.count ?? 0}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={t.is_active ? 'Active' : 'Retired'} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/technicians/${t.technician_id}/edit`}>
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
