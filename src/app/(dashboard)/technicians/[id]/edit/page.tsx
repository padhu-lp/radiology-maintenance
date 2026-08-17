import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { TechnicianForm } from '@/components/technicians/technician-form'
import type { Technician } from '@/lib/types/database'

export default async function EditTechnicianPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('technicians').select('*').eq('technician_id', id).single()

  if (error || !data) redirect('/technicians')
  const t = data as Technician

  return (
    <>
      <PageHeader
        title={`Edit ${t.first_name} ${t.last_name}`}
        description={t.technician_code}
        backHref="/technicians"
        backLabel="Technicians"
      />
      <TechnicianForm technician={t} />
    </>
  )
}
