import { PartsUsageReport } from '@/components/reports/parts-usage-report'

export default function PartsUsageReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Parts Usage Report</h1>
        <p className="text-gray-600">Monitor parts inventory and usage</p>
      </div>
      <PartsUsageReport />
    </div>
  )
}
