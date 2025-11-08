'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface HeaderProps {
  user?: {
    email?: string
  }
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <h1 className="text-2xl font-bold">Radiology Management</h1>
        <div className="flex items-center gap-4">
          {user?.email && <span className="text-sm text-muted-foreground">{user.email}</span>}
          <Button variant="ghost" size="icon">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
