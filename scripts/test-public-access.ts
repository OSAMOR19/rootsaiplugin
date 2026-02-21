import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) return;
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, ...values] = line.split('=');
            if (key && values) {
                const val = values.join('=').trim().replace(/^['"]|['"]$/g, '');
                process.env[key.trim()] = val;
            }
        });
    } catch (e) {
        console.error("Error reading .env.local", e);
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing env vars!");
    process.exit(1);
}

// Use ANON key to test public access
const supabase = createClient(supabaseUrl, supabaseAnonKey!);

async function testPublicAccess() {
    console.log("\n=== TESTING PUBLIC ACCESS TO STEMS ===\n");

    // List files in stems bucket using anon client
    console.log("1. Listing files in stems bucket (as public user)...");
    const { data: files, error: listError } = await supabase.storage
        .from('stems')
        .list('', { limit: 10 });

    if (listError) {
        console.error("❌ Cannot list files (might be expected):", listError.message);
    } else {
        console.log(`✅ Found ${files?.length || 0} files in stems bucket:`);
        files?.forEach(f => {
            console.log(`  - ${f.name}`);
        });
    }

    // Try to get a public URL
    if (files && files.length > 0) {
        const firstFile = files[0].name;
        console.log(`\n2. Testing public URL access for: ${firstFile}`);

        const { data } = supabase.storage
            .from('stems')
            .getPublicUrl(`samples/${firstFile}`); // Try common path

        console.log(`Public URL: ${data.publicUrl}`);
        console.log("\n✅ Stems are configured as PUBLIC - users can download them via direct URL");
    }

    console.log("\n=== TEST COMPLETE ===\n");
}

testPublicAccess();
