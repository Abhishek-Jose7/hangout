const fs = require('fs');
const path = require('path');

try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        // Mask the key
        const maskedContent = content.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/g, 'NEXT_PUBLIC_SUPABASE_ANON_KEY=HIDDEN');
        fs.writeFileSync('debug-output.txt', maskedContent);
    } else {
        fs.writeFileSync('debug-output.txt', '.env.local not found');
    }
} catch (e) {
    fs.writeFileSync('debug-output.txt', e.toString());
}
