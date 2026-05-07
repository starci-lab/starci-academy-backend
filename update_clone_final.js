const fs = require('fs');
const path = require('path');

const dir = 'c:/Repositories/ac/starci-academy-backend/.mount/data/courses/0-fullstack-mastery/modules/3-authentication-authorization-jwt-rbac/contents';

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.md')) {
            processFile(fullPath, file);
        }
    }
}

function processFile(filePath, fileName) {
    let content = fs.readFileSync(filePath, 'utf8');
    const isEn = filePath.endsWith('en.md');
    
    // We only want to replace if there are no comments yet
    if (content.includes('# Bu?c 1:') || content.includes('# Step 1:')) {
        return; // Already processed
    }

    const regex = /`ash\r?\n(git clone https:\/\/github\.com\/[^\r\n]+)\r?\n(cd [^\r\n]+)\r?\n`/g;
    
    if (regex.test(content)) {
        if (!isEn) {
            content = content.replace(regex, 
                '`ash\n# Bu?c 1: Clone repository v? máy local\n\n\n# Bu?c 2: Di chuy?n vào dúng thu m?c bài h?c\n\n`');
        } else {
            content = content.replace(regex, 
                '`ash\n# Step 1: Clone the repository to local machine\n\n\n# Step 2: Navigate to the correct lesson directory\n\n`');
        }
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    }
}

walkDir(dir);
