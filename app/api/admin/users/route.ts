import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
    try {
        // Use admin client to bypass RLS and read all profiles
        // Also pull email from auth.users via the admin API
        const { data: profiles, error } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, plan, created_at, is_pro, stripe_subscription_id, paystack_reference')
            .order('created_at', { ascending: false })

        if (error) throw error

        // Fetch emails from Auth (requires service role)
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 1000,
        })
        if (authError) throw authError

        // Merge: attach email to each profile
        const emailMap = new Map(authUsers.users.map((u) => [u.id, u.email]))
        const merged = (profiles || []).map((p) => ({
            ...p,
            email: emailMap.get(p.id) ?? null,
        }))

        return NextResponse.json({ success: true, users: merged })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to fetch users' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: Request) {
    try {
        const { userId, plan } = await request.json()
        if (!userId || !['free', 'paid'].includes(plan)) {
            return NextResponse.json({ success: false, error: 'Invalid params' }, { status: 400 })
        }

        const is_pro = plan === 'paid'

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ plan, is_pro })
            .eq('id', userId)

        if (error) throw error

        return NextResponse.json({ success: true, plan, is_pro })
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to update user' },
            { status: 500 }
        )
    }
}
