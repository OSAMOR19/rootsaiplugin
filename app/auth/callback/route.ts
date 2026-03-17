import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/browse'

    // Handle proxies (e.g., Render, Vercel) that might set requestUrl.origin to localhost:10000
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
    let redirectOrigin = requestUrl.origin

    if (forwardedHost) {
        redirectOrigin = `${forwardedProto}://${forwardedHost}`
    } else if (process.env.NEXT_PUBLIC_SITE_URL) {
        redirectOrigin = process.env.NEXT_PUBLIC_SITE_URL
    }

    if (code) {
        const response = NextResponse.redirect(`${redirectOrigin}${next}`)
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.headers.get('cookie')?.split('; ').map(c => {
                            const [name, value] = c.split('=')
                            return { name, value }
                        }) || []
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        // Exchange the code for a session
        await supabase.auth.exchangeCodeForSession(code)

        return response
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${redirectOrigin}${next}`)
}
