import { createServerClient } from '@/lib/supabase/server'
import { PartsForm } from '@/components/parts-inventory/parts-form'
import { redirect } from 'next/navigation'

export default async function EditPartPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  const { data: part, error } = await supabase
    .from('parts_inventory')
    .select('*')
    .eq('part_id', params.id)
    .single()

  if (error || !part) {
    redirect('/parts-inventory')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Part</h1>
        <p className="text-gray-600">Update part information</p>
      </div>
      <PartsForm initialData={part} mode="edit" />
    </div>
  )
}
