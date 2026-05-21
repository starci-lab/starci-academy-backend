/**
 * Module gốc — Kết nối DB, Redis (BullMQ), ConfigModule, và Feature Module.
 * (EN: Root module — DB connection, Redis (BullMQ), ConfigModule, and Feature Module.)
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
    databaseConfig,
    redisConfig,
    smtpConfig,
    type DatabaseConfig,
    type RedisConfig,
} from "./config"
import {
    NotificationsModule,
} from "./notifications"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig, redisConfig, smtpConfig],
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
                        host: redis.host,
                        port: redis.port,
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
