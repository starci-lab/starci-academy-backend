const fs = require('fs');
const path = require('path');

const projects = [
    'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-6-email-sms-otp/0-sending-emails-with-nodemailer',
    'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-6-email-sms-otp/1-otp-verification-with-redis',
    'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-6-email-sms-otp/2-integrating-sms-gateways',
    'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-7-workers-and-cron-jobs/0-task-scheduling-cron',
    'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-7-workers-and-cron-jobs/1-bullmq-message-queue'
];

function readJson(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    return JSON.parse(content);
}

const dockerfile = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]`;

const tsconfigBuild = `{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}`;

function replaceFile(filepath, search, replace) {
    if (fs.existsSync(filepath)) {
        let content = fs.readFileSync(filepath, 'utf8');
        content = content.replace(search, replace);
        fs.writeFileSync(filepath, content, 'utf8');
    }
}

for (const p of projects) {
    const slug = path.basename(p);
    
    fs.writeFileSync(path.join(p, 'Dockerfile'), dockerfile, 'utf8');
    fs.writeFileSync(path.join(p, 'tsconfig.build.json'), tsconfigBuild, 'utf8');
    
    const pkgPath = path.join(p, 'package.json');
    if (fs.existsSync(pkgPath)) {
        const json = readJson(pkgPath);
        json.scripts.build = "nest build && tsc-alias -p tsconfig.build.json";
        if (!json.devDependencies) json.devDependencies = {};
        json.devDependencies['tsc-alias'] = "^1.8.10";
        fs.writeFileSync(pkgPath, JSON.stringify(json, null, 2), 'utf8');
    }
    
    const tsconfigPath = path.join(p, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
        const json = readJson(tsconfigPath);
        if (!json.compilerOptions.paths) json.compilerOptions.paths = {};
        json.compilerOptions.paths[`@${slug}`] = ["src/index.ts"];
        json.compilerOptions.paths[`@${slug}/*`] = ["src/*"];
        fs.writeFileSync(tsconfigPath, JSON.stringify(json, null, 4), 'utf8');
    }
    
    const envPath = path.join(p, '.env');
    if (fs.existsSync(envPath)) {
        let content = fs.readFileSync(envPath, 'utf8');
        content = content.replace(/DATABASE_/g, 'POSTGRES_');
        fs.writeFileSync(envPath, content, 'utf8');
    }
    
    const dbConfigPath = path.join(p, 'src/config/database.config.ts');
    if (fs.existsSync(dbConfigPath)) {
        const replaceDb = `export interface DatabaseConfig {
    host: string
    port: number
    username: string
    password: string
    database: string
}

export const databaseConfig = registerAs("database", (): DatabaseConfig => ({
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.POSTGRES_PORT) || 5432,
    username: process.env.POSTGRES_USER ?? "starci_user",
    password: process.env.POSTGRES_PASSWORD ?? "starci_password",
    database: process.env.POSTGRES_DB ?? "starci_db",
}))`;
        let dbContent = fs.readFileSync(dbConfigPath, 'utf8');
        dbContent = dbContent.replace(/export interface DatabaseConfig[\s\S]+/, replaceDb);
        fs.writeFileSync(dbConfigPath, dbContent, 'utf8');
    }
    
    replaceFile(path.join(p, 'src/bootstrap.ts'), /forbidNonWhitelisted: true/, 'forbidUnknownValues: false');
    
    function cleanSpaces(dir) {
        if (!fs.existsSync(dir)) return;
        for (const file of fs.readdirSync(dir)) {
            const f = path.join(dir, file);
            if (fs.statSync(f).isDirectory()) cleanSpaces(f);
            else if (f.endsWith('.ts')) {
                let c = fs.readFileSync(f, 'utf8');
                if (c.includes('\u00A0')) {
                    fs.writeFileSync(f, c.replace(/\u00A0/g, ' '), 'utf8');
                }
            }
        }
    }
    cleanSpaces(path.join(p, 'src'));
}
console.log("Base config setup complete");
