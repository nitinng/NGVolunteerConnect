const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(process.cwd(), 'src'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes('@clerk/nextjs/server')) {
        content = content.replace(/@clerk\/nextjs\/server/g, '@/lib/auth');
        changed = true;
    }

    // For client components
    if (content.includes('@clerk/nextjs')) {
        content = content.replace(/@clerk\/nextjs/g, '@/hooks/use-auth');
        changed = true;
    }

    if (content.includes('clerk_user_id')) {
        content = content.replace(/clerk_user_id/g, 'auth_user_id');
        changed = true;
    }

    if (content.includes('created_by_clerk_id')) {
        content = content.replace(/created_by_clerk_id/g, 'created_by_auth_id');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Updated', file);
    }
});
