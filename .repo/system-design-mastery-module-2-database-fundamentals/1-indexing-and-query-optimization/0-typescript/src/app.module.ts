/**
 * Root module — Postgres + registerAs config + Products module.
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
    postgresConfig,
    type PostgresConfig,
} from "./config"
import {
    ProductsModule,
} from "./products"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, postgresConfig],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const pg = config.getOrThrow<PostgresConfig>("postgres")
                return {
                    type: "postgres" as const,
                    host: pg.host,
                    port: pg.port,
                    username: pg.username,
                    password: pg.password,
                    database: pg.database,
                    autoLoadEntities: true,
                    synchronize: true,
                }
            },
        }),
        ProductsModule,
    ],
})
export class AppModule {}
