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
    const isEn = fileName === 'en.md';
    
    if (content.includes('# Bu?c 1:') || content.includes('# Step 1:')) {
        return;
    }
    
    const lines = content.split(/\r?\n/);
    let output = [];
    let changed = false;
    let i = 0;
    
    while(i < lines.length) {
        if (lines[i].trim() === '`ash' && 
            i + 3 < lines.length && 
            lines[i+1].trim().startsWith('git clone ') && 
            lines[i+2].trim().startsWith('cd ') &&
            lines[i+3].trim() === '`') {
            
            output.push(lines[i]); // `ash
            if (isEn) {
                output.push('  # Step 1: Clone the repository to local machine'.trim());
            } else {
                output.push('  # Bu?c 1: Clone repository v? máy local'.trim());
            }
            output.push(lines[i+1]);
            output.push('');
            if (isEn) {
                output.push('  # Step 2: Navigate to the correct lesson directory'.trim());
            } else {
                output.push('  # Bu?c 2: Di chuy?n vào dúng thu m?c bài h?c'.trim());
            }
            output.push(lines[i+2]);
            output.push(lines[i+3]); // `
            i += 4;
            changed = true;
        } else {
            output.push(lines[i]);
            i++;
        }
    }
    
    if (changed) {
        fs.writeFileSync(filePath, output.join('\n'), 'utf8');
        console.log('Updated:', filePath);
    }
}

directories.forEach(walkDir);
