/**
 * Module gốc — Rate limit (Throttler) + BullMQ priority queue + notifications.
 * (EN: Root module — Throttler rate limit + BullMQ priority queue + notifications.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
    ConfigService,
} from "@nestjs/config"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    BullModule,
} from "@nestjs/bullmq"
import {
    ThrottlerModule,
    ThrottlerGuard,
} from "@nestjs/throttler"
import {
    APP_GUARD,
} from "@nestjs/core"
import {
    MailerModule,
} from "@nestjs-modules/mailer"
import {
    databaseConfig,
    redisConfig,
    smtpConfig,
    rateLimitConfig,
    type DatabaseConfig,
    type RedisConfig,
    type SmtpConfig,
} from "./config"
import {
    NotificationsModule,
} from "./notifications"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig,
                redisConfig,
                smtpConfig,
                rateLimitConfig],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const db = config.getOrThrow<DatabaseConfig>("database")
                return {
                    type: "postgres" as const,
                    host: db.host,
                    port: db.port,
                    username: db.username,
                    password: db.password,
                    database: db.database,
                    autoLoadEntities: true,
                    synchronize: true,
                }
            },
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const redis = config.getOrThrow<RedisConfig>("redis")
                return {
                    connection: {
                        host: redis.host, port: redis.port 
                    } 
                }
            },
        }),
        // Logic — giới hạn HTTP burst (demo; production dùng token bucket Redis trong service).
        // Code — ThrottlerGuard toàn cục: ttl 60s, limit 10 request.
        // (EN Logic: Caps HTTP burst (demo; production uses Redis token bucket in service).)
        // (EN Code: Global ThrottlerGuard: 60s ttl, 10 requests limit.)
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 10,
        }]),
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const smtp = config.getOrThrow<SmtpConfig>("smtp")
                return {
                    transport: {
                        host: smtp.host,
                        port: smtp.port,
                        secure: false,
                        ...(smtp.user ? {
                            auth: {
                                user: smtp.user, pass: smtp.pass 
                            } 
                        } : {
                        }),
                    },
                    defaults: {
                        from: smtp.from,
                    },
                }
            },
        }),
        // Queue notification-priority-queue — priority nhỏ = xử lý trước (OTP=1, Marketing=10).
        // (EN: notification-priority-queue — lower priority number runs first (OTP=1, Marketing=10).)
        NotificationsModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
