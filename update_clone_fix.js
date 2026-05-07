const fs = require('fs');
const path = require('path');

const directories = [
    'c:/Repositories/ac/starci-academy-backend/.mount/data/courses/0-fullstack-mastery/modules/3-authentication-authorization-jwt-rbac/contents',
    'c:/Repositories/ac/starci-academy-backend/.mount/data/courses/0-fullstack-mastery/modules/4-websocket-and-realtime-communication/contents'
];

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
    
    // Check if it's English or Vietnamese file based on name or directory
    const isEn = filePath.endsWith('en.md');
    
    // We match any `ash ... git clone ... cd ... ` block that looks like the clone block
    const regex = /`ash[\r\n]+git clone (https:\/\/github\.com\/[^\r\n]+)[\r\n]+cd ([^\r\n]+)[\r\n]+`/g;
    
    if (regex.test(content)) {
        if (!isEn) {
            content = content.replace(regex, 
                '`ash\n# Bu?c 1: Clone repository v? máy local\ngit clone \n\n# Bu?c 2: Di chuy?n vào dúng thu m?c bài h?c\ncd \n`');
        } else {
            content = content.replace(regex, 
                '`ash\n# Step 1: Clone the repository to local machine\ngit clone \n\n# Step 2: Navigate to the correct lesson directory\ncd \n`');
        }
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    }
}

directories.forEach(walkDir);
