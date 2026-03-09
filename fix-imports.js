const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'src/lib/auth.ts',
    'src/app/api/db-check/route.ts',
    'src/app/actions/user-actions.ts',
    'src/app/actions/supabase-actions.ts',
    'src/app/actions/profile-actions.ts'
];

filesToUpdate.forEach(relativePath => {
    const file = path.join(process.cwd(), relativePath);
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        // Change imports of createServerClient and createAdminClient
        // We might have import { createServerClient } from "@/lib/supabase"
        // Let's replace createServerClient and createAdminClient imports
        content = content.replace(/import\s*\{[^}]*createServerClient[^}]*\}\s*from\s*['"]@\/lib\/supabase['"];?/, (match) => {
            return match.replace('@/lib/supabase', '@/lib/supabase-server');
        });

        content = content.replace(/import\s*\{[^}]*createAdminClient[^}]*\}\s*from\s*['"]@\/lib\/supabase['"];?/, (match) => {
            return match.replace('@/lib/supabase', '@/lib/supabase-server');
        });

        fs.writeFileSync(file, content);
        console.log(`Updated ${relativePath}`);
    }
});
