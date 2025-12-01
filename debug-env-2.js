const fs = require('fs');
const path = require('path');

try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        console.log('--- START .env.local ---');
        console.log(JSON.stringify(content));
        console.log('--- END .env.local ---');
    } else {
        console.log('.env.local not found');
    }
} catch (e) {
    console.error(e);
}
