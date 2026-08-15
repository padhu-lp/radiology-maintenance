import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client for use in Server Components, Route Handlers
 * and Server Actions.
 *
 * Uses the current @supabase/ssr getAll/setAll cookie API. The setAll call is
 * a no-op when invoked from a Server Component (cookies are read-only there);
 * middleware.ts is responsible for refreshing the session cookie.
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Called from a Server Component - safe to ignore because
            // middleware refreshes the session on every request.
          }
        },
      },
    }
  )
}

/** Alias kept for compatibility with older imports. */
export const createClient = createServerClient
