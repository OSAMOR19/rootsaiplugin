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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env vars!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseStoragePolicies() {
    console.log("\n=== SUPABASE STORAGE DIAGNOSIS ===\n");

    // 1. List all buckets
    console.log("1. Checking buckets...");
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
        console.error("Error listing buckets:", bucketsError);
        return;
    }

    console.log("Buckets found:");
    buckets?.forEach(b => {
        console.log(`  - ${b.name} (public: ${b.public}, file_size_limit: ${b.file_size_limit || 'unlimited'})`);
    });

    // 2. Check policies on storage.objects table
    console.log("\n2. Checking RLS policies on storage.objects...");
    const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('schemaname', 'storage')
        .eq('tablename', 'objects');

    if (policiesError) {
        console.log("Could not fetch policies (this might be expected):", policiesError.message);
    } else if (policies && policies.length > 0) {
        console.log(`Found ${policies.length} policies:`);
        policies.forEach((p: any) => {
            console.log(`  - ${p.policyname} (${p.cmd}): ${p.qual || 'N/A'}`);
        });
    } else {
        console.log("No policies found (or no access to pg_policies view)");
    }

    // 3. Try to upload a test file
    console.log("\n3. Testing upload to 'stems' bucket...");
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const testPath = `test-${Date.now()}.txt`;

    const { error: uploadError } = await supabase.storage
        .from('stems')
        .upload(testPath, testFile);

    if (uploadError) {
        console.error("❌ Upload test FAILED:", uploadError.message);
        console.log("\nRECOMMENDATION: RLS policies are blocking uploads. Use the nuclear option SQL script.");
    } else {
        console.log("✅ Upload test SUCCEEDED!");
        // Clean up
        await supabase.storage.from('stems').remove([testPath]);
    }

    console.log("\n=== DIAGNOSIS COMPLETE ===\n");
}

diagnoseStoragePolicies();
