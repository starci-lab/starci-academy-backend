const fs = require('fs');
const projects = [
    'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-6-email-sms-otp/2-integrating-sms-gateways',
    'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-7-workers-and-cron-jobs/0-task-scheduling-cron',
    'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-7-workers-and-cron-jobs/1-bullmq-message-queue'
];

for (const p of projects) {
    const pkgPath = `${p}/package.json`;
    let content = fs.readFileSync(pkgPath, 'utf8');
    if (!content.includes('tsc-alias')) {
        const json = JSON.parse(content);
        json.scripts.build = "nest build && tsc-alias -p tsconfig.build.json";
        json.devDependencies['tsc-alias'] = "^1.8.10";
        fs.writeFileSync(pkgPath, JSON.stringify(json, null, 2));
    }
}
console.log("package.json updated");
