const fs = require('fs');
const path = require('path');

const targetRepos = [
    'fullstack-mastery-module-4-authentication-authorization-jwt-rbac',
    'fullstack-mastery-module-5-websocket-and-realtime-communication',
    'fullstack-mastery-module-6-email-sms-otp',
    'fullstack-mastery-module-6-workers-and-cron-jobs',
    'fullstack-mastery-module-7-workers-and-cron-jobs',
    'fullstack-mastery-module-8-react-basic'
];

function processFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // dang ky cac thanh phan cua feature -> đăng ký các thành phần của feature
    content = content.replace(/dang ky cac thanh phan cua feature (\w+)/g, "đăng ký các thành phần của feature $1");
    // payload dang ky -> payload đăng ký
    content = content.replace(/payload dang ky/g, "payload đăng ký");
    
    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed accents in', file);
    }
}

function walkSync(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                walkSync(p);
            }
        } else if (file.endsWith('.ts')) {
            processFile(p);
        }
    });
}

targetRepos.forEach(repo => {
    const full = path.join('c:/Repositories/ac/starci-academy-backend/.repo', repo);
    console.log('Scanning', full);
    walkSync(full);
});
