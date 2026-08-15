'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AppRole = 'admin' | 'technician' | 'viewer'

/**
 * Role of the signed-in user, read from public.user_profiles.
 *
 * The RLS policy on user_profiles lets a user select their own row, so this
 * works without any elevated privileges. Returns null while loading or if the
 * user has no profile row.
 *
 * This drives UI affordances only - hiding a button is not a security control.
 * The database policies in migrations/006_enable_rls_rbac.sql are what actually
 * enforce access.
 */
export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) {
          setRole(null)
          setLoading(false)
        }
        return
      }

      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!cancelled) {
        setRole(((data as { role?: AppRole } | null)?.role) ?? null)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isStaff: role === 'admin' || role === 'technician',
  }
}
