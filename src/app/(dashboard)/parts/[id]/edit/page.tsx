import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { PartForm } from '@/components/parts/part-form'
import type { PartsInventory } from '@/lib/types/database'

export default async function EditPartPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('parts_inventory').select('*').eq('part_id', id).single()

  if (error || !data) redirect('/parts')
  const p = data as PartsInventory

  return (
    <>
      <PageHeader
        title={`Edit ${p.part_name}`}
        description={`${p.part_code} · ${p.part_number}`}
        backHref="/parts"
        backLabel="Parts"
      />
      <PartForm part={p} />
    </>
  )
}
