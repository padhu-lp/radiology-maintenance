import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Pencil, AlertTriangle } from 'lucide-react'
import { DASH, date, money } from '@/lib/format'
import type { Equipment } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm mt-0.5">{value || DASH}</div>
    </div>
  )
}

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('equipment')
    .select(`*,
      customers(customer_id, customer_name, customer_code),
      locations(department_name, facility_name, building, room_number),
      manufacturers(manufacturer_name)`)
    .eq('equipment_id', id)
    .single()

  if (error || !data) redirect('/equipment')

  const e = data as unknown as Equipment & {
    customers: { customer_id: string; customer_name: string; customer_code: string } | null
    locations: {
      department_name: string; facility_name: string | null
      building: string | null; room_number: string | null
    } | null
    manufacturers: { manufacturer_name: string } | null
  }

  const warrantyExpired =
    e.warranty_expiry !== null && new Date(e.warranty_expiry) < new Date()

  const site = e.locations
    ? [e.locations.department_name, e.locations.facility_name, e.locations.building, e.locations.room_number]
        .filter(Boolean).join(' · ')
    : null

  return (
    <>
      <PageHeader
        title={e.equipment_name}
        description={`${e.equipment_code} · ${e.equipment_type}`}
        backHref="/equipment"
        backLabel="Equipment"
        actions={
          <Link href={`/equipment/${id}/edit`}>
            <Button variant="outline"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <StatusBadge value={e.status} />
        {e.risk_level && <StatusBadge value={e.risk_level} />}
        {warrantyExpired && (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            <AlertTriangle className="h-3 w-3" />
            Warranty expired {date(e.warranty_expiry)}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Identification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Type" value={e.equipment_type} />
            <Field label="Manufacturer" value={e.manufacturers?.manufacturer_name} />
            <Field label="Model" value={e.model_number} />
            <Field label="Serial number" value={e.serial_number} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Ownership</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Customer"
              value={
                e.customers ? (
                  <Link href={`/customers/${e.customers.customer_id}`} className="hover:underline">
                    {e.customers.customer_name}
                    <span className="text-muted-foreground"> ({e.customers.customer_code})</span>
                  </Link>
                ) : null
              }
            />
            <Field label="Site" value={site} />
            {e.notes && <Field label="Notes" value={e.notes} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Lifecycle</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Installed" value={date(e.installation_date)} />
            <Field label="Purchased" value={date(e.purchase_date)} />
            <Field label="Purchase price" value={money(e.purchase_price)} />
            <Field
              label="Warranty expiry"
              value={
                <span className={warrantyExpired ? 'text-red-600 font-medium' : undefined}>
                  {date(e.warranty_expiry)}
                </span>
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Service history, maintenance schedules and QC tests appear here once those
          sections are built.
        </CardContent>
      </Card>
    </>
  )
}
