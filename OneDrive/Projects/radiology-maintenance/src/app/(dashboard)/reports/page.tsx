import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download } from 'lucide-react'
import Link from 'next/link'

export default function ReportsPage() {
  const reportTypes = [
    {
      title: 'Equipment Status Report',
      description: 'Current status of all equipment',
      href: null,
      enabled: false,
    },
    {
      title: 'Maintenance History',
      description: 'Historical maintenance records',
      href: '/reports/maintenance-history',
      enabled: true,
    },
    {
      title: 'Work Order Summary',
      description: 'Completed and pending work orders',
      href: null,
      enabled: false,
    },
    {
      title: 'Parts Usage Report',
      description: 'Parts inventory and consumption',
      href: '/reports/parts-usage',
      enabled: true,
    },
    {
      title: 'Warranty Expiry Report',
      description: 'Equipment warranty status',
      href: null,
      enabled: false,
    },
    {
      title: 'Cost Analysis',
      description: 'Equipment and maintenance costs',
      href: null,
      enabled: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-gray-600">Generate and view system reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{report.description}</p>
              {report.enabled && report.href ? (
                <Link href={report.href}>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    View Report
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Coming Soon
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
