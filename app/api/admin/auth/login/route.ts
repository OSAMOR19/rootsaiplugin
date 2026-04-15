import { NextResponse } from 'next/server'

// Simple stateless secure token generation for single-admin setup using Web Crypto API
async function generateAdminToken() {
    const encoder = new TextEncoder()
    const secret = process.env.ADMIN_SESSION_SECRET || 'dev_fallback_secret_12345'
    const data = encoder.encode(secret + 'admin_authorized_stamp')
    
    // Fallback to basic hasing string if webcrypto fails, but it's natively supported in Next.js Edge and Node
    try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (e) {
        // Very basic fallback
        return Buffer.from(secret).toString('base64')
    }
}

export async function POST(request: Request) {
    try {
        const { password } = await request.json()

        // Verify password against secure server-side env variable (with fallback to the requested default)
        const validPassword = process.env.ADMIN_PASSWORD || 'MTA777@rootsaiadmin'
        if (password !== validPassword) {
            return NextResponse.json(
                { success: false, error: 'Invalid password' },
                { status: 401 }
            )
        }

        const token = await generateAdminToken()

        // Set secure HttpOnly cookie
        const response = NextResponse.json({ success: true })
        response.cookies.set({
            name: 'admin_session',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 24 hours
        })

        return response
    } catch (error) {
        console.error('Admin login error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
