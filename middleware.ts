import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require a logged-in session
const PROTECTED_ROUTES = ['/favorites', '/settings', '/sample']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const response = NextResponse.next()

    // Only run auth check on explicitly protected routes
    const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    if (!isProtected) return response

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return response
}

export const config = {
    matcher: [
        // Skip Next.js internals, static files, and api routes
        '/((?!_next/static|_next/image|favicon.ico|api/|admin/).*)',
    ],
}
