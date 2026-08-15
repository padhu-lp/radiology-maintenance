import { PartsForm } from '@/components/parts-inventory/parts-form'

export default function NewPartPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Part</h1>
        <p className="text-gray-600">Add a new part to your inventory</p>
      </div>
      <PartsForm mode="create" />
    </div>
  )
}
