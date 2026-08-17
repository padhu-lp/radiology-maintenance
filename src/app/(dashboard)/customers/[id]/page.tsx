import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader, EmptyState } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pencil } from 'lucide-react'
import { DASH, date } from '@/lib/format'
import type { Customer } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5">{value || DASH}</p>
    </div>
  )
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('customers')
    .select(`*,
      locations(location_id, department_name, facility_name, room_number, is_active),
      equipment(equipment_id, equipment_code, equipment_name, equipment_type, status)`)
    .eq('customer_id', id)
    .single()

  if (error || !data) redirect('/customers')

  const c = data as unknown as Customer & {
    locations: Array<{
      location_id: string; department_name: string
      facility_name: string | null; room_number: string | null; is_active: boolean
    }>
    equipment: Array<{
      equipment_id: string; equipment_code: string
      equipment_name: string; equipment_type: string; status: string
    }>
  }

  return (
    <>
      <PageHeader
        title={c.customer_name}
        description={`${c.customer_code} · added ${date(c.created_at)}`}
        backHref="/customers"
        backLabel="Customers"
        actions={
          <Link href={`/customers/${id}/edit`}>
            <Button variant="outline"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Contact person" value={c.contact_name} />
            <Field label="Phone" value={c.phone} />
            <Field label="Email" value={c.email} />
            <Field
              label="Address"
              value={
                [c.address, c.city, c.state_province, c.postal_code, c.country]
                  .filter(Boolean).join(', ')
              }
            />
            <Field label="Status" value={<StatusBadge value={c.is_active ? 'Active' : 'Retired'} />} />
            {c.notes && <Field label="Notes" value={c.notes} />}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Sites &amp; departments</CardTitle>
              <span className="text-sm text-muted-foreground">{c.locations?.length ?? 0}</span>
            </CardHeader>
            <CardContent className="p-0">
              {!c.locations?.length ? (
                <EmptyState
                  title="No sites recorded"
                  description="Sites let you place equipment in a specific department or room."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Facility</TableHead>
                      <TableHead>Room</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {c.locations.map((l) => (
                      <TableRow key={l.location_id}>
                        <TableCell className="font-medium">{l.department_name}</TableCell>
                        <TableCell>{l.facility_name ?? DASH}</TableCell>
                        <TableCell>{l.room_number ?? DASH}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Equipment</CardTitle>
              <span className="text-sm text-muted-foreground">{c.equipment?.length ?? 0}</span>
            </CardHeader>
            <CardContent className="p-0">
              {!c.equipment?.length ? (
                <EmptyState title="No equipment registered against this customer" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {c.equipment.map((e) => (
                      <TableRow key={e.equipment_id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {e.equipment_code}
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/equipment/${e.equipment_id}`} className="hover:underline">
                            {e.equipment_name}
                          </Link>
                        </TableCell>
                        <TableCell>{e.equipment_type}</TableCell>
                        <TableCell><StatusBadge value={e.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
