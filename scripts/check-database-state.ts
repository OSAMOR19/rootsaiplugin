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

async function checkDatabaseState() {
    console.log("\n=== DATABASE STATE CHECK ===\n");

    // 1. List all packs
    console.log("1. Checking packs table...");
    const { data: packs, error: packsError } = await supabase
        .from('packs')
        .select('*')
        .order('created_at', { ascending: false });

    if (packsError) {
        console.error("Error fetching packs:", packsError);
    } else {
        console.log(`Found ${packs?.length || 0} packs:`);
        packs?.forEach(p => {
            console.log(`  - ${p.title} (ID: ${p.id})`);
        });
    }

    // 2. List all samples
    console.log("\n2. Checking samples table...");
    const { data: samples, error: samplesError } = await supabase
        .from('samples')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (samplesError) {
        console.error("Error fetching samples:", samplesError);
    } else {
        console.log(`Found ${samples?.length || 0} recent samples (showing last 10):`);
        samples?.forEach(s => {
            console.log(`  - ${s.name} (Category: ${s.category}, Stems: ${s.stems?.length || 0})`);
            if (s.stems && s.stems.length > 0) {
                s.stems.forEach((stem: any) => {
                    console.log(`    └─ ${stem.name} (${stem.filename})`);
                });
            }
        });
    }

    // 3. List files in stems bucket
    console.log("\n3. Checking stems bucket contents...");
    const { data: files, error: filesError } = await supabase.storage
        .from('stems')
        .list('', { limit: 100 });

    if (filesError) {
        console.error("Error listing stems bucket:", filesError);
    } else {
        console.log(`Found ${files?.length || 0} items in stems bucket:`);
        files?.forEach(f => {
            console.log(`  - ${f.name} (${(f.metadata?.size / 1024 / 1024).toFixed(2)} MB)`);
        });
    }

    console.log("\n=== CHECK COMPLETE ===\n");
}

checkDatabaseState();
