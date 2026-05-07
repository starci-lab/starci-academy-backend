const fs = require('fs');
const path = require('path');

const targetRepos = [
    'fullstack-mastery-module-4-authentication-authorization-jwt-rbac',
    'fullstack-mastery-module-5-websocket-and-realtime-communication',
    'fullstack-mastery-module-6-email-sms-otp',
    'fullstack-mastery-module-6-workers-and-cron-jobs',
    'fullstack-mastery-module-7-workers-and-cron-jobs'
];

function processAppModule(lessonDir) {
    const appModPath = path.join(lessonDir, 'src', 'app.module.ts');
    if (!fs.existsSync(appModPath)) return;
    
    let content = fs.readFileSync(appModPath, 'utf8');
    
    content = content.replace(/config\.get\("database\.postgres\.host"\)/g, 'config.get<string>("database.postgres.host")');
    content = content.replace(/config\.get\("database\.postgres\.port"\)/g, 'config.get<number>("database.postgres.port")');
    content = content.replace(/config\.get\("database\.postgres\.username"\)/g, 'config.get<string>("database.postgres.username")');
    content = content.replace(/config\.get\("database\.postgres\.password"\)/g, 'config.get<string>("database.postgres.password")');
    content = content.replace(/config\.get\("database\.postgres\.database"\)/g, 'config.get<string>("database.postgres.database")');
    
    fs.writeFileSync(appModPath, content);
}

targetRepos.forEach(repo => {
    const full = path.join('c:/Repositories/ac/starci-academy-backend/.repo', repo);
    if (!fs.existsSync(full)) return;
    fs.readdirSync(full).forEach(f => {
        const lessonPath = path.join(full, f);
        if (fs.statSync(lessonPath).isDirectory() && !f.startsWith('.')) {
            processAppModule(lessonPath);
        }
    });
});
