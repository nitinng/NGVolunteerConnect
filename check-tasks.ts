const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTasks() {
    console.log("Checking onboarding_tasks table...");
    const { data, error } = await supabase.from('onboarding_tasks').select('*');
    if (error) {
        console.error("Error fetching tasks:", error);
    } else {
        console.log(`Found ${data.length} tasks.`);
        if (data.length > 0) {
            console.log("Sample task:", data[0]);
        }
    }
}

checkTasks();
