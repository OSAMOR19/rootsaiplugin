import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for admin access (ONLY use server-side)
// Note: This file should ONLY be imported in server-side files (API routes, scripts)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
