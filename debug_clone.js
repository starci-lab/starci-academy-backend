const fs = require('fs');
let content = fs.readFileSync('c:/Repositories/ac/starci-academy-backend/.mount/data/courses/0-fullstack-mastery/modules/3-authentication-authorization-jwt-rbac/contents/1-refresh-token-strategy/vi.md', 'utf8');
const lines = content.split(/\r?\n/);
for (let i=0; i<lines.length; i++) {
    if (lines[i].includes('git clone')) {
        console.log('Line ' + i + ':', JSON.stringify(lines[i-1]));
        console.log('Line ' + i + ':', JSON.stringify(lines[i]));
        console.log('Line ' + i + ':', JSON.stringify(lines[i+1]));
        console.log('Line ' + i + ':', JSON.stringify(lines[i+2]));
    }
}
