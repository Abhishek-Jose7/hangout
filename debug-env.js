const fs = require('fs');
const path = require('path');

try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        lines.forEach(line => {
            if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
                console.log('URL:', line.split('=')[1].trim());
            }
            if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
                console.log('KEY_PRESENT: true');
            }
        });
    } else {
        console.log('.env.local not found');
    }
} catch (e) {
    console.error(e);
}
