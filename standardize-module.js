const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetRepo = process.argv[2];
if (!targetRepo) {
    console.error('Usage: node standardize-module.js <absolute-path-to-repo>');
    process.exit(1);
}

function replaceMojibake(text) {
    // Simple replacement map for the common Vietnamese mojibake
    const replacements = {
        'Ã¡': 'á', 'Ã ': 'à', 'áº£': 'ả', 'Ã£': 'ã', 'áº¡': 'ạ',
        'Ã¢': 'â', 'áº¥': 'ấ', 'áº§': 'ầ', 'áº©': 'ẩ', 'áº«': 'ẫ', 'áº­': 'ậ',
        'Äƒ': 'ă', 'áº¯': 'ắ', 'áº±': 'ằ', 'áº³': 'ẳ', 'áºµ': 'ẵ', 'áº·': 'ặ',
        'Ã©': 'é', 'Ã¨': 'è', 'áº»': 'ẻ', 'áº½': 'ẽ', 'áº¹': 'ẹ',
        'Ãª': 'ê', 'áº¿': 'ế', 'á» ': 'ề', 'á»ƒ': 'ể', 'á»…': 'ễ', 'á»‡': 'ệ',
        'Ã­': 'í', 'Ã¬': 'ì', 'á»‰': 'ỉ', 'Ä©': 'ĩ', 'á»‹': 'ị',
        'Ã³': 'ó', 'Ã²': 'ò', 'á» ': 'ỏ', 'Ãµ': 'õ', 'á»': 'ọ',
        'Ã´': 'ô', 'á»‘': 'ố', 'á»“': 'ồ', 'á»•': 'ổ', 'á»—': 'ỗ', 'á»™': 'ộ',
        'Æ¡': 'ơ', 'á»›': 'ớ', 'á»': 'ờ', 'á»Ÿ': 'ở', 'á»¡': 'ỡ', 'á»£': 'ợ',
        'Ãº': 'ú', 'Ã¹': 'ù', 'á»§': 'ủ', 'Å©': 'ũ', 'á»¥': 'ụ',
        'Æ°': 'ư', 'á»©': 'ứ', 'á»«': 'ừ', 'á»­': 'ử', 'á»¯': 'ữ', 'á»±': 'ự',
        'Ã½': 'ý', 'á»³': 'ỳ', 'á»·': 'ỷ', 'á»¹': 'ỹ', 'á»µ': 'ỵ',
        'Ä‘': 'đ', 'Ã”': 'Ô', 'Ã': 'Á', 'Ã€': 'À', 'ÃŠ': 'Ê', 'Ä': 'Đ'
    };
    let out = text;
    for (const [k, v] of Object.entries(replacements)) {
        out = out.split(k).join(v);
    }
    return out;
}

function processLesson(lessonDir) {
    console.log(`Processing: ${lessonDir}`);
    const srcDir = path.join(lessonDir, 'src');
    if (!fs.existsSync(srcDir)) return;

    // 1. Delete old class-validator config
    const oldConfigs = ['environment-variables.ts', 'validate-env.ts', 'env.config.ts'];
    oldConfigs.forEach(f => {
        const fp = path.join(srcDir, 'config', f);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
    });

    // 2. Identify needs
    let needsDb = false;
    let needsJwt = false;
    let needsRedis = false;

    // Check compose.yaml
    const composePath = path.join(lessonDir, '.docker', 'compose.yaml');
    if (fs.existsSync(composePath)) {
        const compose = fs.readFileSync(composePath, 'utf8');
        if (compose.includes('postgres:')) needsDb = true;
        if (compose.includes('redis:')) needsRedis = true;
    } else {
        // Fallback check app.module.ts
        const appMod = path.join(srcDir, 'app.module.ts');
        if (fs.existsSync(appMod)) {
            const content = fs.readFileSync(appMod, 'utf8');
            if (content.includes('TypeOrmModule')) needsDb = true;
        }
    }
    // Also check for JWT
    const pjsonPath = path.join(lessonDir, 'package.json');
    if (fs.existsSync(pjsonPath)) {
        const pjson = fs.readFileSync(pjsonPath, 'utf8');
        if (pjson.includes('@nestjs/jwt')) needsJwt = true;
    }

    // 3. Create config files
    if (!fs.existsSync(path.join(srcDir, 'config'))) {
        fs.mkdirSync(path.join(srcDir, 'config'));
    }
    let configIndexExports = [];

    if (needsDb) {
        fs.writeFileSync(path.join(srcDir, 'config', 'database.config.ts'), `import { registerAs } from "@nestjs/config"

export interface DatabaseConfig {
    postgres: {
        host: string
        port: number
        username: string
        password: string
        database: string
    }
}

export const databaseConfig = registerAs("database", (): DatabaseConfig => ({
    postgres: {
        host: process.env.DATABASE_HOST ?? "localhost",
        port: Number(process.env.DATABASE_PORT) || 5432,
        username: process.env.DATABASE_USER ?? "starci_user",
        password: process.env.DATABASE_PASSWORD ?? "starci_password",
        database: process.env.DATABASE_NAME ?? "starci_db",
    },
}))
`);
        configIndexExports.push('export * from "./database.config"');
    }

    if (needsJwt) {
        fs.writeFileSync(path.join(srcDir, 'config', 'jwt.config.ts'), `import { registerAs } from "@nestjs/config"

export interface JwtConfig {
    secret: string
    expiresIn: string
    refreshSecret?: string
    refreshExpiresIn?: string
}

export const jwtConfig = registerAs("jwt", (): JwtConfig => ({
    secret: process.env.JWT_SECRET ?? "default-secret",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "default-refresh-secret",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
}))
`);
        configIndexExports.push('export * from "./jwt.config"');
    }

    if (needsRedis) {
        fs.writeFileSync(path.join(srcDir, 'config', 'redis.config.ts'), `import { registerAs } from "@nestjs/config"

export interface RedisConfig {
    host: string
    port: number
}

export const redisConfig = registerAs("redis", (): RedisConfig => ({
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
}))
`);
        configIndexExports.push('export * from "./redis.config"');
    }

    // Always add AppConfig
    fs.writeFileSync(path.join(srcDir, 'config', 'app.config.ts'), `import { registerAs } from "@nestjs/config"

export interface AppConfig {
    port: number
}

export const appConfig = registerAs("app", (): AppConfig => ({
    port: Number(process.env.PORT) || 3000,
}))
`);
    configIndexExports.push('export * from "./app.config"');

    fs.writeFileSync(path.join(srcDir, 'config', 'index.ts'), configIndexExports.join('\n') + '\n');

    // 4. Create .env
    let envContent = 'PORT=3000\n';
    if (needsDb) {
        envContent += 'DATABASE_HOST=localhost\nDATABASE_PORT=5432\nDATABASE_USER=starci_user\nDATABASE_PASSWORD=starci_password\nDATABASE_NAME=starci_db\n';
    }
    if (needsJwt) {
        envContent += 'JWT_SECRET=super-secret\nJWT_EXPIRES_IN=15m\nJWT_REFRESH_SECRET=super-refresh-secret\nJWT_REFRESH_EXPIRES_IN=7d\n';
    }
    if (needsRedis) {
        envContent += 'REDIS_HOST=localhost\nREDIS_PORT=6379\n';
    }
    fs.writeFileSync(path.join(lessonDir, '.env'), envContent);

    // 5. Rewrite app.module.ts
    // This part is tricky because app.module.ts could be complex. 
    // We'll replace the ConfigModule.forRoot part.
    const appModPath = path.join(srcDir, 'app.module.ts');
    if (fs.existsSync(appModPath)) {
        let content = fs.readFileSync(appModPath, 'utf8');
        // Fix imports
        content = content.replace(/import \{.*?validateEnv.*?\} from ".\/config\/env.config"/gs, 'import { databaseConfig, jwtConfig, redisConfig, appConfig } from "./config"');
        content = content.replace(/validate: validateEnv,/g, '');
        content = content.replace(/envFilePath: \[".env.local", ".env"\],/g, '');
        content = content.replace(/ConfigModule.forRoot\(\{(.*?)\}\)/gs, (match, inner) => {
            let loads = ['appConfig'];
            if (needsDb) loads.push('databaseConfig');
            if (needsJwt) loads.push('jwtConfig');
            if (needsRedis) loads.push('redisConfig');
            return `ConfigModule.forRoot({ isGlobal: true, load: [${loads.join(', ')}] })`;
        });
        
        // Fix TypeOrmModule
        if (needsDb) {
             content = content.replace(/host: config.getOrThrow<string>\("DATABASE_HOST"\)/g, 'host: config.get("database.postgres.host")');
             content = content.replace(/port: config.getOrThrow<number>\("DATABASE_PORT"\)/g, 'port: config.get("database.postgres.port")');
             content = content.replace(/username: config.getOrThrow<string>\("DATABASE_USER"\)/g, 'username: config.get("database.postgres.username")');
             content = content.replace(/password: config.getOrThrow<string>\("DATABASE_PASSWORD"\)/g, 'password: config.get("database.postgres.password")');
             content = content.replace(/database: config.getOrThrow<string>\("DATABASE_NAME"\)/g, 'database: config.get("database.postgres.database")');
             
             // If they used process.env directly inside TypeOrmModule.forRoot (like in M5 L0)
             content = content.replace(/host: process.env.DATABASE_HOST \?\? "localhost"/g, 'host: config.get("database.postgres.host")');
             content = content.replace(/port: Number\(process.env.DATABASE_PORT \?\? 5432\)/g, 'port: config.get("database.postgres.port")');
             content = content.replace(/username: process.env.DATABASE_USER \?\? "starci_user"/g, 'username: config.get("database.postgres.username")');
             content = content.replace(/password: process.env.DATABASE_PASSWORD \?\? "starci_password"/g, 'password: config.get("database.postgres.password")');
             content = content.replace(/database: process.env.DATABASE_NAME \?\? "starci_db"/g, 'database: config.get("database.postgres.database")');
        }
        
        fs.writeFileSync(appModPath, content);
    }

    // 6. Fix mojibake everywhere
    const walkSync = function(dir, filelist) {
        files = fs.readdirSync(dir);
        filelist = filelist || [];
        files.forEach(function(file) {
            if (fs.statSync(path.join(dir, file)).isDirectory()) {
                if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                    filelist = walkSync(path.join(dir, file), filelist);
                }
            } else {
                if (file.endsWith('.ts') || file.endsWith('.md')) {
                    filelist.push(path.join(dir, file));
                }
            }
        });
        return filelist;
    };

    const allFiles = walkSync(lessonDir);
    allFiles.forEach(file => {
        const text = fs.readFileSync(file, 'utf8');
        const fixed = replaceMojibake(text);
        if (text !== fixed) {
            fs.writeFileSync(file, fixed, 'utf8');
        }
    });

    // 7. Fix Deep Exports in index.ts
    const indexFiles = allFiles.filter(f => f.endsWith('index.ts'));
    indexFiles.forEach(f => {
        let content = fs.readFileSync(f, 'utf8');
        let lines = content.split('\n');
        let changed = false;
        let newLines = [];
        lines.forEach(l => {
            const m = l.match(/export \{ (.*?) \} from "\.\/(.*?)\/(.*?)\.dto"/);
            const m2 = l.match(/export type \{ (.*?) \} from "\.\/(.*?)\/(.*?)\.interface"/);
            if (m) {
                // l is export { CreateUserDto } from "./dto/create-user.dto"
                // change to export { CreateUserDto } from "./dto"
                // create dto/index.ts
                const folder = m[2];
                const file = m[3] + '.dto';
                const folderPath = path.join(path.dirname(f), folder);
                if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, {recursive: true});
                const barrel = path.join(folderPath, 'index.ts');
                if (!fs.existsSync(barrel)) {
                    fs.writeFileSync(barrel, 'export * from "./' + file + '"\\n');
                } else {
                    let b = fs.readFileSync(barrel, 'utf8');
                    if (!b.includes(file)) fs.appendFileSync(barrel, 'export * from "./' + file + '"\\n');
                }
                newLines.push('export { ' + m[1] + ' } from "./' + folder + '"');
                changed = true;
            } else if (m2) {
                const folder = m2[2];
                const file = m2[3] + '.interface';
                const folderPath = path.join(path.dirname(f), folder);
                if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, {recursive: true});
                const barrel = path.join(folderPath, 'index.ts');
                if (!fs.existsSync(barrel)) {
                    fs.writeFileSync(barrel, 'export * from "./' + file + '"\\n');
                } else {
                    let b = fs.readFileSync(barrel, 'utf8');
                    if (!b.includes(file)) fs.appendFileSync(barrel, 'export * from "./' + file + '"\\n');
                }
                newLines.push('export type { ' + m2[1] + ' } from "./' + folder + '"');
                changed = true;
            } else {
                newLines.push(l);
            }
        });
        if (changed) {
            fs.writeFileSync(f, newLines.join('\n'));
        }
    });

    // 8. Run eslint and format
    try {
        execSync('npm install --no-fund --no-audit', { cwd: lessonDir, stdio: 'ignore' });
        execSync('npx eslint "**/*.ts" --fix', { cwd: lessonDir, stdio: 'ignore' });
    } catch(e) {}
}

const folders = fs.readdirSync(targetRepo);
folders.forEach(f => {
    const full = path.join(targetRepo, f);
    if (fs.statSync(full).isDirectory() && !f.startsWith('.')) {
        processLesson(full);
    }
});
console.log('DONE');
