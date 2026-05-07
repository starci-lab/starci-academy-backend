const fs = require('fs');
const path = require('path');

const projects = [
    'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-6-email-sms-otp/0-sending-emails-with-nodemailer',
    'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-6-email-sms-otp/1-otp-verification-with-redis',
    'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-6-email-sms-otp/2-integrating-sms-gateways',
    'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-7-workers-and-cron-jobs/0-task-scheduling-cron',
    'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-7-workers-and-cron-jobs/1-bullmq-message-queue'
];

for (const p of projects) {
    const slug = path.basename(p);
    
    // tsconfig.json
    const tsconfigPath = path.join(p, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
        let content = fs.readFileSync(tsconfigPath, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        const json = JSON.parse(content);
        if (!json.compilerOptions.paths) json.compilerOptions.paths = {};
        json.compilerOptions.paths[`@${slug}`] = ["src/index.ts"];
        json.compilerOptions.paths[`@${slug}/*`] = ["src/*"];
        fs.writeFileSync(tsconfigPath, JSON.stringify(json, null, 4));
    }
    
    // .env
    const envPath = path.join(p, '.env');
    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/DATABASE_/g, 'POSTGRES_');
        fs.writeFileSync(envPath, envContent);
    }
    
    // database.config.ts
    const dbConfigPath = path.join(p, 'src/config/database.config.ts');
    if (fs.existsSync(dbConfigPath)) {
        let dbContent = fs.readFileSync(dbConfigPath, 'utf8');
        // Replace to flat structure if it has postgres: {
        dbContent = dbContent.replace(/export interface DatabaseConfig \{\r?\n\s+postgres: \{\r?\n\s+host: string\r?\n\s+port: number\r?\n\s+username: string\r?\n\s+password: string\r?\n\s+database: string\r?\n\s+\}\r?\n\}/, 
            'export interface DatabaseConfig {\n    host: string\n    port: number\n    username: string\n    password: string\n    database: string\n}');
        dbContent = dbContent.replace(/export const databaseConfig = registerAs\("database",\s*\(\): DatabaseConfig => \(\{\r?\n\s+postgres: \{\r?\n\s+host: process\.env\.DATABASE_HOST \?\? "[^"]+",\r?\n\s+port: Number\(process\.env\.DATABASE_PORT\) \|\| 5432,\r?\n\s+username: process\.env\.DATABASE_USER \?\? "[^"]+",\r?\n\s+password: process\.env\.DATABASE_PASSWORD \?\? "[^"]+",\r?\n\s+database: process\.env\.DATABASE_NAME \?\? "[^"]+",\r?\n\s+\},\r?\n\s*\}\)\)/,
            'export const databaseConfig = registerAs("database", (): DatabaseConfig => ({\n    host: process.env.POSTGRES_HOST ?? "localhost",\n    port: Number(process.env.POSTGRES_PORT) || 5432,\n    username: process.env.POSTGRES_USER ?? "starci_user",\n    password: process.env.POSTGRES_PASSWORD ?? "starci_password",\n    database: process.env.POSTGRES_DB ?? "starci_db",\n}))');
        fs.writeFileSync(dbConfigPath, dbContent);
    }
}
console.log("Configs updated");
