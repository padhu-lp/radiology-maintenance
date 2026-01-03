'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

interface HeaderProps {
  user?: {
    email?: string
  }
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { error } = await supabase.auth.signOut()

      if (error) {
        toast.error(error.message || 'Failed to sign out')
        return
      }

      toast.success('Signed out successfully')
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <h1 className="text-2xl font-bold">Radiology Management</h1>
        <div className="flex items-center gap-4">
          {user?.email && <span className="text-sm text-muted-foreground">{user.email}</span>}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={isLoading}
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
