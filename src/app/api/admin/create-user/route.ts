import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * Admin-only endpoint for provisioning users.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (server-only - never prefix it with
 * NEXT_PUBLIC_). The service-role key bypasses RLS entirely, so this route
 * must verify the caller is an authenticated user before doing anything.
 */

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: 'Server is not configured for user creation (missing SUPABASE_SERVICE_ROLE_KEY).' },
      { status: 500 }
    )
  }

  // Gate on the caller's own session before touching the service-role client.
  const supabase = await createServerClient()
  const { data: { user: caller } } = await supabase.auth.getUser()

  if (!caller) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    )
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Force a password change on first sign-in.
  if (data.user) {
    await admin.from('user_profiles').upsert({
      user_id: data.user.id,
      must_change_password: true,
    })
  }

  return NextResponse.json({
    user: { id: data.user?.id, email: data.user?.email },
  })
}
