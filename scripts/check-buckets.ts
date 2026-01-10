
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
    console.log("URL:", supabaseUrl);
    console.log("KEY:", supabaseServiceKey ? "Present" : "Missing");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listBuckets() {
    console.log("Checking Supabase buckets...");
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error("Error listing buckets:", error);
        return;
    }

    console.log("Buckets found:");
    data.forEach(b => {
        console.log(`- ${b.name} (public: ${b.public})`);
    });
}

listBuckets();
