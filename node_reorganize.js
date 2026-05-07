const fs = require('fs');
const path = require('path');

function moveDir(src, dest) {
    if (fs.existsSync(src)) {
        if (!fs.existsSync(path.dirname(dest))) fs.mkdirSync(path.dirname(dest), {recursive: true});
        fs.renameSync(src, dest);
    }
}

// M6_1
const m6_1 = 'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-6-email-sms-otp/1-otp-verification-with-redis/src';
moveDir(`${m6_1}/otp`, `${m6_1}/modules/otp`);
moveDir(`${m6_1}/redis`, `${m6_1}/modules/redis`);
fs.writeFileSync(`${m6_1}/modules/index.ts`, 'export * from "./otp"\nexport * from "./redis"', 'utf8');
const m6_1_app = `/**
 * AppModule — đăng ký các thành phần của feature App.
 * (EN: AppModule — registers components for App feature.)
 */
import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { appConfig, redisConfig } from "./config"
import { OtpModule, RedisModule } from "./modules"

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig, redisConfig] }),
        RedisModule,
        OtpModule,
    ],
})
export class AppModule {}`;
fs.writeFileSync(`${m6_1}/app.module.ts`, m6_1_app, 'utf8');

// M6_2
const m6_2 = 'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-6-email-sms-otp/2-integrating-sms-gateways/src';
moveDir(`${m6_2}/sms`, `${m6_2}/modules/sms`);
fs.writeFileSync(`${m6_2}/modules/index.ts`, 'export * from "./sms"', 'utf8');
const m6_2_app = `/**
 * AppModule — đăng ký các thành phần của feature App.
 * (EN: AppModule — registers components for App feature.)
 */
import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { appConfig } from "./config"
import { SmsModule } from "./modules"

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
        SmsModule,
    ],
})
export class AppModule {}`;
fs.writeFileSync(`${m6_2}/app.module.ts`, m6_2_app, 'utf8');

const m6_2_interface = `${m6_2}/modules/sms/interfaces/sms-provider.interface.ts`;
if (!fs.existsSync(path.dirname(m6_2_interface))) fs.mkdirSync(path.dirname(m6_2_interface), {recursive: true});
fs.writeFileSync(m6_2_interface, `export interface ISmsProvider {
    sendSms(to: string, message: string): Promise<string>;
}
export const SMS_PROVIDER = "SMS_PROVIDER";`, 'utf8');

// M7_0
const m7_0 = 'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-7-workers-and-cron-jobs/0-task-scheduling-cron/src';
moveDir(`${m7_0}/backup`, `${m7_0}/modules/backup`);
moveDir(`${m7_0}/users`, `${m7_0}/modules/users`);
fs.writeFileSync(`${m7_0}/modules/index.ts`, 'export * from "./users"\nexport * from "./backup"', 'utf8');
const m7_0_app = `/**
 * AppModule — đăng ký các thành phần của feature App.
 * (EN: AppModule — registers components for App feature.)
 */
import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { ScheduleModule } from "@nestjs/schedule"
import { TypeOrmModule } from "@nestjs/typeorm"
import { appConfig, databaseConfig } from "./config"
import { BackupModule, UsersModule } from "./modules"

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig, databaseConfig] }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: "postgres",
                host: config.get<string>("database.host"),
                port: config.get<number>("database.port"),
                username: config.get<string>("database.username"),
                password: config.get<string>("database.password"),
                database: config.get<string>("database.database"),
                autoLoadEntities: true,
                synchronize: true,
            }),
        }),
        ScheduleModule.forRoot(),
        UsersModule,
        BackupModule,
    ],
})
export class AppModule {}`;
fs.writeFileSync(`${m7_0}/app.module.ts`, m7_0_app, 'utf8');

// M7_1
const m7_1 = 'c:/Repositories/ac/starci-academy-backend/.repo/fullstack-mastery-module-7-workers-and-cron-jobs/1-bullmq-message-queue/src';
moveDir(`${m7_1}/video`, `${m7_1}/modules/video`);
fs.writeFileSync(`${m7_1}/modules/index.ts`, 'export * from "./video"', 'utf8');
const m7_1_app = `/**
 * AppModule — đăng ký các thành phần của feature App.
 * (EN: AppModule — registers components for App feature.)
 */
import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { BullModule } from "@nestjs/bullmq"
import { appConfig, redisConfig } from "./config"
import { VideoModule } from "./modules"

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig, redisConfig] }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: config.get<string>("redis.host"),
                    port: config.get<number>("redis.port"),
                },
            }),
        }),
        VideoModule,
    ],
})
export class AppModule {}`;
fs.writeFileSync(`${m7_1}/app.module.ts`, m7_1_app, 'utf8');

console.log("Modules reorganized");
