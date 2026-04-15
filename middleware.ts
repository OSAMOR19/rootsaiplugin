import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require a logged-in session.
// The home page (/), /auth/*, and /admin/* stay public.
const PROTECTED_ROUTES = [
    '/browse',
    '/explore',
    '/sounds',
    '/results',
    '/pack',
    '/sample',
    '/favorites',
    '/favourite',
    '/settings',
    '/loop-player',
    '/audio-demo',
    '/audio-test',
    '/r2-demo',
]

// Simple secure stateless token verification
async function verifyAdminToken(token: string) {
    if (!token) return false
    try {
        const encoder = new TextEncoder()
        const secret = process.env.ADMIN_SESSION_SECRET || 'dev_fallback_secret_12345'
        const data = encoder.encode(secret + 'admin_authorized_stamp')
        
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const expectedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        
        return token === expectedToken
    } catch (e) {
        // Fallback for environments lacking crypto.subtle (though Next.js Edge supports it)
        const expectedBasic = Buffer.from(process.env.ADMIN_SESSION_SECRET || 'dev_fallback_secret_12345').toString('base64')
        return token === expectedBasic
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const response = NextResponse.next()

    // --- ADMIN SECURITY CHECK ---
    const isAdminPath = pathname.startsWith('/admin')
    const isAdminApi = pathname.startsWith('/api/admin')
    const isLoginRoute = pathname === '/admin/login' || pathname === '/api/admin/auth/login'
    
    if ((isAdminPath || isAdminApi) && !isLoginRoute) {
        const adminCookie = request.cookies.get('admin_session')?.value || ''
        const isValid = await verifyAdminToken(adminCookie)
        
        if (!isValid) {
            if (isAdminApi) {
                return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 })
            }
            const loginUrl = new URL('/admin/login', request.url)
            return NextResponse.redirect(loginUrl)
        }
    }

    // Only run normal user auth check on explicitly protected routes
    const isProtectedUserRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    if (!isProtectedUserRoute) return response

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
        // Protect protected routes, /admin, and /api/admin. Skip static files
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
