import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage system preferences and configuration</p>
      </div>

      <div className="grid gap-6">
        {/* User Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>User Preferences</CardTitle>
            <CardDescription>Customize your profile and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="your.email@example.com" />
            </div>
            <Button disabled>Save Preferences</Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure system-wide settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="org">Organization Name</Label>
              <Input id="org" placeholder="Your organization" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" placeholder="UTC" />
            </div>
            <Button disabled>Save Settings</Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <input type="checkbox" id="email_alerts" defaultChecked className="h-4 w-4" />
              <Label htmlFor="email_alerts" className="mb-0">Email notifications for alerts</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="maintenance_reminders" defaultChecked className="h-4 w-4" />
              <Label htmlFor="maintenance_reminders" className="mb-0">Maintenance schedule reminders</Label>
            </div>
            <Button disabled className="mt-6">Save Notifications</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
