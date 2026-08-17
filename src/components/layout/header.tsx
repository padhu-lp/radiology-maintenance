'use client'

import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useUserRole } from '@/hooks/use-user-role'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, KeyRound } from 'lucide-react'

export function Header({ user }: { user: User }) {
  const router = useRouter()
  const { role } = useUserRole()

  const email = user.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  const signOut = async () => {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 shrink-0 border-b bg-white flex items-center justify-between px-6">
      <div />

      <div className="flex items-center gap-3">
        {role && (
          <span className="text-xs rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600 capitalize">
            {role}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-slate-200">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm hidden sm:inline">{email}</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium truncate">{email}</p>
              <p className="text-xs text-muted-foreground capitalize">{role ?? 'no role assigned'}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/change-password')}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
