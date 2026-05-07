const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetRepos = [
    'fullstack-mastery-module-4-authentication-authorization-jwt-rbac',
    'fullstack-mastery-module-5-websocket-and-realtime-communication',
    'fullstack-mastery-module-6-email-sms-otp',
    'fullstack-mastery-module-6-workers-and-cron-jobs',
    'fullstack-mastery-module-7-workers-and-cron-jobs'
];

function replaceMojibake(text) {
    const replacements = {
        'Ã¡': 'á', 'Ã ': 'à', 'áº£': 'ả', 'Ã£': 'ã', 'áº¡': 'ạ',
        'Ã¢': 'â', 'áº¥': 'ấ', 'áº§': 'ầ', 'áº©': 'ẩ', 'áº«': 'ẫ', 'áº­': 'ậ',
        'Äƒ': 'ă', 'áº¯': 'ắ', 'áº±': 'ằ', 'áº³': 'ẳ', 'áºµ': 'ẵ', 'áº·': 'ặ',
        'Ã©': 'é', 'Ã¨': 'è', 'áº»': 'ẻ', 'áº½': 'ẽ', 'áº¹': 'ẹ',
        'Ãª': 'ê', 'áº¿': 'ế', 'á» ': 'ề', 'á»ƒ': 'ể', 'á»…': 'ễ', 'á»‡': 'ệ',
        'Ã­': 'í', 'Ã¬': 'ì', 'á»‰': 'ỉ', 'Ä©': 'ĩ', 'á»‹': 'ị',
        'Ã³': 'ó', 'Ã²': 'ò', 'á» ': 'ỏ', 'Ãµ': 'õ', 'á» ': 'ọ',
        'Ã´': 'ô', 'á»‘': 'ố', 'á»“': 'ồ', 'á»•': 'ổ', 'á»—': 'ỗ', 'á»™': 'ộ',
        'Æ¡': 'ơ', 'á»›': 'ớ', 'á» ': 'ờ', 'á»Ÿ': 'ở', 'á»¡': 'ỡ', 'á»£': 'ợ',
        'Ãº': 'ú', 'Ã¹': 'ù', 'á»§': 'ủ', 'Å©': 'ũ', 'á»¥': 'ụ',
        'Æ°': 'ư', 'á»©': 'ứ', 'á»«': 'ừ', 'á»­': 'ử', 'á»¯': 'ữ', 'á»±': 'ự',
        'Ã½': 'ý', 'á»³': 'ỳ', 'á»·': 'ỷ', 'á»¹': 'ỹ', 'á»µ': 'ỵ',
        'Ä‘': 'đ', 'Ã”': 'Ô', 'Ã ': 'Á', 'Ã€': 'À', 'ÃŠ': 'Ê', 'Ä ': 'Đ'
    };
    let out = text;
    for (const [k, v] of Object.entries(replacements)) {
        out = out.split(k).join(v);
    }
    // Also fix unaccented
    out = out.replace(/dang ky cac thanh phan cua feature (\w+)/g, "đăng ký các thành phần của feature $1");
    out = out.replace(/payload dang ky/g, "payload đăng ký");
    return out;
}

function processAppModule(lessonDir) {
    const srcDir = path.join(lessonDir, 'src');
    const appModPath = path.join(srcDir, 'app.module.ts');
    if (!fs.existsSync(appModPath)) return;

    // 1. Checkout the original app.module.ts from 2 commits ago
    try {
        execSync('git checkout HEAD~2 -- src/app.module.ts', { cwd: lessonDir, stdio: 'ignore' });
    } catch(e) {}

    let content = fs.readFileSync(appModPath, 'utf8');

    // 2. Identify needs
    let needsDb = false;
    let needsJwt = false;
    let needsRedis = false;
    const composePath = path.join(lessonDir, '.docker', 'compose.yaml');
    if (fs.existsSync(composePath)) {
        const compose = fs.readFileSync(composePath, 'utf8');
        if (compose.includes('postgres:')) needsDb = true;
        if (compose.includes('redis:')) needsRedis = true;
    } else if (content.includes('TypeOrmModule')) {
        needsDb = true;
    }
    const pjsonPath = path.join(lessonDir, 'package.json');
    if (fs.existsSync(pjsonPath)) {
        const pjson = fs.readFileSync(pjsonPath, 'utf8');
        if (pjson.includes('@nestjs/jwt')) needsJwt = true;
    }

    let loads = ['appConfig'];
    if (needsDb) loads.push('databaseConfig');
    if (needsJwt) loads.push('jwtConfig');
    if (needsRedis) loads.push('redisConfig');
    const loadStr = `ConfigModule.forRoot({ isGlobal: true, load: [${loads.join(', ')}] })`;

    // 3. Fix imports
    // Safely replace validateEnv import
    content = content.replace(/import\s*\{\s*validateEnv,?\s*\}\s*from\s*"\.\/config\/env\.config"/, `import { ${loads.join(', ')} } from "./config"`);
    // If it didn't have validateEnv but we need to import configs
    if (!content.includes('from "./config"')) {
        // Just inject it after the last import
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
            const endOfLastImport = content.indexOf('"\n', lastImportIndex) + 2;
            content = content.slice(0, endOfLastImport) + `import { ${loads.join(', ')} } from "./config"\n` + content.slice(endOfLastImport);
        }
    }

    // 4. Fix ConfigModule
    // Safe replace
    content = content.replace(/ConfigModule\.forRoot\(\{[\s\S]*?\}\)/, loadStr);
    
    // 5. Fix TypeOrmModule
    if (needsDb) {
         content = content.replace(/host:\s*config\.getOrThrow<string>\("DATABASE_HOST"\)/g, 'host: config.get("database.postgres.host")');
         content = content.replace(/port:\s*config\.getOrThrow<number>\("DATABASE_PORT"\)/g, 'port: config.get("database.postgres.port")');
         content = content.replace(/username:\s*config\.getOrThrow<string>\("DATABASE_USER"\)/g, 'username: config.get("database.postgres.username")');
         content = content.replace(/password:\s*config\.getOrThrow<string>\("DATABASE_PASSWORD"\)/g, 'password: config.get("database.postgres.password")');
         content = content.replace(/database:\s*config\.getOrThrow<string>\("DATABASE_NAME"\)/g, 'database: config.get("database.postgres.database")');
         
         content = content.replace(/host:\s*process\.env\.DATABASE_HOST\s*\?\?\s*"localhost"/g, 'host: config.get("database.postgres.host")');
         content = content.replace(/port:\s*Number\(process\.env\.DATABASE_PORT\s*\?\?\s*5432\)/g, 'port: config.get("database.postgres.port")');
         content = content.replace(/username:\s*process\.env\.DATABASE_USER\s*\?\?\s*"starci_user"/g, 'username: config.get("database.postgres.username")');
         content = content.replace(/password:\s*process\.env\.DATABASE_PASSWORD\s*\?\?\s*"starci_password"/g, 'password: config.get("database.postgres.password")');
         content = content.replace(/database:\s*process\.env\.DATABASE_NAME\s*\?\?\s*"starci_db"/g, 'database: config.get("database.postgres.database")');
    }

    // 6. Fix mojibake
    content = replaceMojibake(content);

    fs.writeFileSync(appModPath, content);
}

targetRepos.forEach(repo => {
    const full = path.join('c:/Repositories/ac/starci-academy-backend/.repo', repo);
    if (!fs.existsSync(full)) return;
    const folders = fs.readdirSync(full);
    folders.forEach(f => {
        const lessonPath = path.join(full, f);
        if (fs.statSync(lessonPath).isDirectory() && !f.startsWith('.')) {
            processAppModule(lessonPath);
        }
    });
});
console.log('DONE REWRITING APP.MODULE.TS');
