import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Formerly middleware.ts. Next.js 16.3 renamed the file convention to `proxy`
 * to make it clearer that this runs at a network boundary in front of the app,
 * not as Express-style middleware. Behaviour is unchanged.
 *
 * Route groups in parentheses - (auth), (dashboard) - do not appear in the URL,
 * so every dashboard feature sits at the top level. List each protected prefix
 * explicitly rather than assuming everything lives under /dashboard.
 */
const PROTECTED_PREFIXES = [
  '/admin',
  '/alerts',
  '/customers',
  '/dashboard',
  '/equipment',
  '/inventory',
  '/maintenance',
  '/manufacturers',
  '/parts-inventory',
  '/reports',
  '/schedule',
  '/settings',
  '/technicians',
  '/work-orders',
]

/** Auth pages a signed-in user should be bounced away from. */
const AUTH_ONLY_PATHS = ['/login', '/register', '/forgot-password']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Never let a slow auth call hang the whole request.
  let user = null
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Auth check timeout')), 5000)
    )
    const { data: { user: authUser } } = await Promise.race([
      supabase.auth.getUser(),
      timeoutPromise,
    ]) as Awaited<ReturnType<typeof supabase.auth.getUser>>
    user = authUser
  } catch (error) {
    console.warn('Auth check failed:', error instanceof Error ? error.message : 'Unknown error')
    user = null
  }

  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && AUTH_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
