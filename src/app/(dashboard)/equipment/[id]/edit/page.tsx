import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { EquipmentForm } from '@/components/equipment/equipment-form'
import type { Equipment } from '@/lib/types/database'

export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('equipment').select('*').eq('equipment_id', id).single()

  if (error || !data) redirect('/equipment')
  const e = data as Equipment

  return (
    <>
      <PageHeader
        title={`Edit ${e.equipment_name}`}
        description={e.equipment_code}
        backHref={`/equipment/${id}`}
        backLabel="Back to equipment"
      />
      <EquipmentForm equipment={e} />
    </>
  )
}
