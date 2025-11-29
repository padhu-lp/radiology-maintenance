import { MaintenanceHistoryReport } from '@/components/reports/maintenance-history-report'

export default function MaintenanceHistoryReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Maintenance History Report</h1>
        <p className="text-gray-600">View and analyze equipment maintenance records</p>
      </div>
      <MaintenanceHistoryReport />
    </div>
  )
}
