import { ManufacturerForm } from '@/components/manufacturers/manufacturer-form'

export default function NewManufacturerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Manufacturer</h1>
        <p className="text-gray-600">Create a new manufacturer or supplier</p>
      </div>

      <ManufacturerForm mode="create" />
    </div>
  )
}
