import { createServerClient } from '@/lib/supabase/server'
import { TechnicianForm } from '@/components/technicians/technician-form'
import { redirect } from 'next/navigation'

export default async function EditTechnicianPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  const { data: technician, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('technician_id', params.id)
    .single()

  if (error || !technician) {
    redirect('/technicians')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Technician</h1>
        <p className="text-gray-600">Update technician information</p>
      </div>
      <TechnicianForm initialData={technician} mode="edit" />
    </div>
  )
}
