import { TechnicianForm } from '@/components/technicians/technician-form'

export default function NewTechnicianPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Technician</h1>
        <p className="text-gray-600">Add a new technician to your team</p>
      </div>
      <TechnicianForm mode="create" />
    </div>
  )
}
