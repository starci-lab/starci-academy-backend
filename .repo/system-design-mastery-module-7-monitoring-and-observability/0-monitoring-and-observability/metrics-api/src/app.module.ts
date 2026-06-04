/**
 * Root module — Postgres + cats module + HTTP metrics middleware.
 */
import {
    MiddlewareConsumer,
    Module,
    NestModule,
} from "@nestjs/common"
import {
    ConfigModule,
    ConfigService,
} from "@nestjs/config"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    databaseConfig,
    type DatabaseConfig,
} from "./config"
import {
    CatsModule,
} from "./cats"
import {
    CatsController,
} from "./cats"
import {
    HttpMetricsMiddleware,
} from "./metrics"
import {
    MetricsController,
} from "./metrics.controller"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
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
        CatsModule,
    ],
    controllers: [MetricsController],
    providers: [HttpMetricsMiddleware],
})
/**
 * Class `AppModule` — lesson lab component.
 */
export class AppModule implements NestModule {
    /**
     * Apply metrics middleware to Cats and Metrics controller routes.
     */
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(HttpMetricsMiddleware)
            .forRoutes(
                CatsController,
                MetricsController,
            )
    }
}
