export {};
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: tables, error } = await supabase.rpc('get_tables'); // Won't work unless RPC exists
    if (error) {
        // Try raw query if possible, or just check specific tables
        console.log("Checking tables manually...");
        const tableNames = ['onboarding_modules', 'onboarding_tasks', 'onboarding_content_blocks', 'general_onboarding_modules'];
        for (const name of tableNames) {
            const { error: err } = await supabase.from(name).select('count', { count: 'exact', head: true });
            if (err) {
                console.log(`Table ${name}: ERROR - ${err.message}`);
            } else {
                console.log(`Table ${name}: EXISTS`);
            }
        }
    } else {
        console.log("Tables:", tables);
    }
}

check();
