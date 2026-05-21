/**
 * Module gốc — Postgres + BullMQ + Notifications feature.
 * (EN: Root module — Postgres + BullMQ + Notifications feature.)
 */
import { Module } from "@nestjs/common"
import {
    ConfigModule,
    ConfigService,
} from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { BullModule } from "@nestjs/bullmq"
import { MailerModule } from "@nestjs-modules/mailer"
import {
    databaseConfig, redisConfig, smtpFailoverConfig, retryConfig,
    type DatabaseConfig, type RedisConfig, type SmtpFailoverConfig,
} from "./config"
import { NotificationsModule } from "./notifications"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig, redisConfig, smtpFailoverConfig, retryConfig],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const db = config.getOrThrow<DatabaseConfig>("database")
                return {
                    type: "postgres" as const,
                    host: db.host, port: db.port,
                    username: db.username, password: db.password,
                    database: db.database,
                    autoLoadEntities: true, synchronize: true,
                }
            },
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const redis = config.getOrThrow<RedisConfig>("redis")
                return { connection: { host: redis.host, port: redis.port } }
            },
        }),
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const smtp = config.getOrThrow<SmtpFailoverConfig>("smtpFailover")
                return {
                    transport: {
                        host: smtp.primaryHost,
                        port: smtp.primaryPort,
                        secure: false,
                        connectionTimeout: 5000,
                        socketTimeout: 5000,
                    },
                    transports: {
                        secondary: {
                            host: smtp.secondaryHost,
                            port: smtp.secondaryPort,
                            secure: false,
                            connectionTimeout: 5000,
                            socketTimeout: 5000,
                        },
                    },
                    defaults: {
                        from: smtp.from,
                    },
                }
            },
        }),
        NotificationsModule,
    ],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
