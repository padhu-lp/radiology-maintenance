import { EquipmentForm } from '@/components/equipment/equipment-form'

export default function NewEquipmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Equipment</h1>
        <p className="text-gray-600">Register a new piece of equipment in the system</p>
      </div>

      <div className="max-w-4xl">
        <EquipmentForm mode="create" />
      </div>
    </div>
  )
}
