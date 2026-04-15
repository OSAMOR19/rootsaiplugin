import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://destavcezpxwsxkpubqn.supabase.co"
const serviceRole = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlc3RhdmNlenB4d3N4a3B1YnFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc3NTIyMCwiZXhwIjoyMDgyMzUxMjIwfQ.uxrZW020uFn3NPXCsdlcLBcLYngJfz96ktz6CBYvVrY"

const supabase = createClient(supabaseUrl, serviceRole)

async function test() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1)
    console.log("Profiles Data:", data)
    console.log("Error:", error)
}
test()
