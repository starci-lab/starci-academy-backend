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
    
    const isEn = filePath.endsWith('en.md');
    
    // Split into lines to do a simpler replacement
    const lines = content.split(/\r?\n/);
    let newLines = [];
    let i = 0;
    let changed = false;
    
    while(i < lines.length) {
        if (lines[i].trim() === '`ash' && 
            i + 2 < lines.length && 
            lines[i+1].trim().startsWith('git clone ') && 
            lines[i+2].trim().startsWith('cd ') &&
            lines[i+3].trim() === '`') {
            
            newLines.push('`ash');
            if (!isEn) {
                newLines.push('# Bu?c 1: Clone repository v? máy local');
                newLines.push(lines[i+1]);
                newLines.push('');
                newLines.push('# Bu?c 2: Di chuy?n vào dúng thu m?c bài h?c');
                newLines.push(lines[i+2]);
            } else {
                newLines.push('# Step 1: Clone the repository to local machine');
                newLines.push(lines[i+1]);
                newLines.push('');
                newLines.push('# Step 2: Navigate to the correct lesson directory');
                newLines.push(lines[i+2]);
            }
            newLines.push('`');
            i += 4;
            changed = true;
        } else {
            newLines.push(lines[i]);
            i++;
        }
    }
    
    if (changed) {
        fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
        console.log('Updated:', filePath);
    }
}

directories.forEach(walkDir);
