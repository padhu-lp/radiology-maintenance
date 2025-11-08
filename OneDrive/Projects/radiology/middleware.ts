import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // Get user with timeout to prevent hanging
    let user = null
    try {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        )
        const { data: { user: authUser } } = await Promise.race([
            supabase.auth.getUser(),
            timeoutPromise
        ]) as Awaited<ReturnType<typeof supabase.auth.getUser>>
        user = authUser
    } catch (error) {
        // If auth check fails or times out, treat as unauthenticated
        console.warn('Auth check failed:', error instanceof Error ? error.message : 'Unknown error')
        user = null
    }

    // Protected routes
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect logged-in users away from auth pages
    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}