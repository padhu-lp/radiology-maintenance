import { createServerClient } from '@/lib/supabase/server'
import { MaintenanceForm } from '@/components/maintenance/maintenance-form'
import { redirect } from 'next/navigation'

export default async function EditMaintenancePage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  const { data: schedule, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('schedule_id', params.id)
    .single()

  if (error || !schedule) {
    redirect('/maintenance')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Maintenance Schedule</h1>
        <p className="text-gray-600">Update maintenance schedule details</p>
      </div>
      <MaintenanceForm initialData={schedule} mode="edit" />
    </div>
  )
}
