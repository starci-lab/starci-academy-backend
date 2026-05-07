const fs = require('fs');
const path = require('path');

function walkSync(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') walkSync(p);
        } else if (file.endsWith('.ts') || file.endsWith('.md')) {
            let content = fs.readFileSync(p, 'utf8');
            let original = content;
            content = content.replace(/â€”/g, '—');
            content = content.replace(/vÃ /g, 'và');
            content = content.replace(/nÃ y/g, 'này');
            content = content.replace(/bÃ i/g, 'bài');
            content = content.replace(/thÃ nh/g, 'thành');
            content = content.replace(/trÃ¬nh/g, 'trình');
            content = content.replace(/vÃ /g, 'và');
            
            // Clean up any double spaces that might occur
            content = content.replace(/và  /g, 'và ');
            
            if (content !== original) {
                fs.writeFileSync(p, content, 'utf8');
                console.log('Fixed', p);
            }
        }
    });
}

const repos = [
    'fullstack-mastery-module-4-authentication-authorization-jwt-rbac',
    'fullstack-mastery-module-5-websocket-and-realtime-communication',
    'fullstack-mastery-module-6-email-sms-otp',
    'fullstack-mastery-module-6-workers-and-cron-jobs',
    'fullstack-mastery-module-7-workers-and-cron-jobs',
    'fullstack-mastery-module-8-react-basic'
];

repos.forEach(repo => {
    walkSync(path.join('c:/Repositories/ac/starci-academy-backend/.repo', repo));
});
