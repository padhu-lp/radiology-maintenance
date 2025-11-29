import { MaintenanceForm } from '@/components/maintenance/maintenance-form'

export default function NewMaintenancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Maintenance Schedule</h1>
        <p className="text-gray-600">Add a new equipment maintenance schedule</p>
      </div>
      <MaintenanceForm mode="create" />
    </div>
  )
}
