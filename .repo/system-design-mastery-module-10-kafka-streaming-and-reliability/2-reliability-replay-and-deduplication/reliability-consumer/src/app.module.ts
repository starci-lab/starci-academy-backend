/**
 * Module gốc — Kafka consumer + Postgres + Redis dedup (ConfigService).
 * (EN: Root module — Kafka consumer + Postgres + Redis dedup (ConfigService).)
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
    appConfig,
    databaseConfig,
    kafkaConfig,
    redisConfig,
    type DatabaseConfig,
} from "./config"
import {
    ReliabilityController,
} from "./reliability"
import {
    ReliabilityService,
} from "./reliability"
import {
    ProcessedEventEntity,
} from "./entities"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, kafkaConfig, databaseConfig, redisConfig],
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
        TypeOrmModule.forFeature([ProcessedEventEntity]),
    ],
    controllers: [ReliabilityController],
    providers: [ReliabilityService],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
