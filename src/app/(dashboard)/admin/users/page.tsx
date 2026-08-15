'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icons } from '@/components/icons'
import { useToast } from '@/components/ui/use-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Feature flag: Set to true to enable user creation
const ENABLE_USER_CREATION = false

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface CreatedUser {
  id: string
  email: string
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<CreatedUser | null>(null)
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema)
  })

  const onSubmit = async (data: CreateUserFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to create user')
        return
      }

      setSuccess(result.user)
      setCreatedUsers([...createdUsers, { id: result.user.id, email: result.user.email }])
      reset()

      toast({
        title: 'Success',
        description: `User ${data.email} created successfully`,
      })
    } catch (err) {
      setError('An error occurred while creating the user')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-gray-600 mt-2">Create test users and manage application access</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Create Test User</CardTitle>
            <CardDescription>Add a new user to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    <strong>{success.email}</strong> created successfully!
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="tester@example.com"
                  disabled={!ENABLE_USER_CREATION || isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  {...register('password')}
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  disabled={!ENABLE_USER_CREATION || isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  disabled={!ENABLE_USER_CREATION || isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={!ENABLE_USER_CREATION || isLoading}>
                {isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : ENABLE_USER_CREATION ? (
                  'Create User'
                ) : (
                  'User Creation Disabled'
                )}
              </Button>
              {!ENABLE_USER_CREATION && (
                <Alert>
                  <AlertDescription className="text-sm">
                    User creation is currently disabled. To enable it, set <code className="bg-gray-100 px-1 py-0.5 rounded">ENABLE_USER_CREATION = true</code> in the page component.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Created Users List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Created Users ({createdUsers.length})</CardTitle>
            <CardDescription>Test users created in this session</CardDescription>
          </CardHeader>
          <CardContent>
            {createdUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No users created yet. Create one using the form on the left.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {createdUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.id}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions for Testers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">How to Log In</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Go to <code className="bg-white px-2 py-1 rounded border border-blue-200">https://radiology.padhu.tech/login</code></li>
              <li>Enter the email and password created in this form</li>
              <li>Click "Sign In"</li>
              <li>You'll be redirected to the dashboard</li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2">⚠️ Security Note</h3>
            <p className="text-sm text-amber-800">
              This page is for creating test users only. In production, use the standard registration page
              at <code className="bg-white px-2 py-1 rounded border border-amber-200">/register</code> or the Supabase console.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
