import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { ManufacturerForm } from '@/components/manufacturers/manufacturer-form'
import type { Manufacturer } from '@/lib/types/database'

export default async function EditManufacturerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('manufacturers')
    .select('*')
    .eq('manufacturer_id', id)
    .single()

  if (error || !data) redirect('/manufacturers')
  const m = data as Manufacturer

  return (
    <>
      <PageHeader
        title={`Edit ${m.manufacturer_name}`}
        description={m.manufacturer_code}
        backHref="/manufacturers"
        backLabel="Manufacturers"
      />
      <ManufacturerForm manufacturer={m} />
    </>
  )
}
