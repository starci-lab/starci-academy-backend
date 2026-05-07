const fs = require('fs');
const path = require('path');

const targetRepos = [
    'fullstack-mastery-module-4-authentication-authorization-jwt-rbac',
    'fullstack-mastery-module-5-websocket-and-realtime-communication',
    'fullstack-mastery-module-6-email-sms-otp',
    'fullstack-mastery-module-6-workers-and-cron-jobs',
    'fullstack-mastery-module-7-workers-and-cron-jobs'
];

function processFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // config.getOrThrow<string>("JWT_SECRET") -> config.get("jwt.accessSecret")
    content = content.replace(/config\.getOrThrow<string>\("JWT_SECRET"\)/g, 'config.get("jwt.accessSecret")');
    content = content.replace(/config\.getOrThrow<string>\("JWT_ACCESS_SECRET"\)/g, 'config.get("jwt.accessSecret")');
    content = content.replace(/config\.getOrThrow<string>\("JWT_REFRESH_SECRET"\)/g, 'config.get("jwt.refreshSecret")');
    
    // Also handle config.get<string>("JWT_SECRET")
    content = content.replace(/config\.get<string>\("JWT_SECRET"\)/g, 'config.get("jwt.accessSecret")');
    content = content.replace(/config\.get<string>\("JWT_ACCESS_SECRET"\)/g, 'config.get("jwt.accessSecret")');
    content = content.replace(/config\.get<string>\("JWT_REFRESH_SECRET"\)/g, 'config.get("jwt.refreshSecret")');
    
    // And in guards/strategies that might use ExtractJwt
    content = content.replace(/process\.env\.JWT_SECRET\s*\?\?\s*"[^"]+"/g, 'process.env.JWT_ACCESS_SECRET ?? "starci_access_secret"');
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed', file);
    }
}

function walkSync(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') walkSync(p);
        } else if (file.endsWith('.ts')) {
            processFile(p);
        }
    });
}

targetRepos.forEach(repo => {
    walkSync(path.join('c:/Repositories/ac/starci-academy-backend/.repo', repo));
});
