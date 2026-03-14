import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client for public access (safe for browser) using SSR cookies
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
