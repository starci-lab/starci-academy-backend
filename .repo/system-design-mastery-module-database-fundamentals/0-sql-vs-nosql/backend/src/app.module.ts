/**
 * Root module — ConfigModule.forRoot, TypeOrmModule.forRootAsync, MongooseModule.forRootAsync.
 * (EN: Root module — ConfigModule.forRoot, TypeOrmModule.forRootAsync, MongooseModule.forRootAsync.)
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
    MongooseModule,
} from "@nestjs/mongoose"
import {
    appConfig,
    postgresConfig,
    mongoConfig,
} from "@0-sql-vs-nosql/config"
import {
    ProductEntity,
} from "@0-sql-vs-nosql/sql/entities/product.entity"
import {
    SqlModule,
} from "@0-sql-vs-nosql/sql/sql.module"
import {
    NosqlModule,
} from "@0-sql-vs-nosql/nosql/nosql.module"
import {
    CompareModule,
} from "@0-sql-vs-nosql/compare/compare.module"

/**
 * Root module — load tat ca config, ket noi PostgreSQL va MongoDB, import cac feature module.
 * (EN: Root module — load all configs, connect PostgreSQL and MongoDB, import feature modules.)
 */
@Module({
    imports: [
        // ConfigModule global — load tat ca registerAs config.
        // (EN: Global ConfigModule — load all registerAs configs.)
        ConfigModule.forRoot({
            isGlobal: true,
            load: [
                appConfig,
                postgresConfig,
                mongoConfig,
            ],
        }),

        // TypeORM — ket noi PostgreSQL tu namespace "postgres".
        // (EN: TypeORM — connect PostgreSQL from "postgres" namespace.)
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: "postgres",
                host: configService.get<string>("postgres.host"),
                port: configService.get<number>("postgres.port"),
                username: configService.get<string>("postgres.user"),
                password: configService.get<string>("postgres.password"),
                database: configService.get<string>("postgres.db"),
                entities: [ProductEntity],
                // Tu dong dong bo schema — chi dung cho dev/lab.
                // (EN: Auto-sync schema — dev/lab only.)
                synchronize: true,
            }),
        }),

        // Mongoose — ket noi MongoDB tu namespace "mongo".
        // (EN: Mongoose — connect MongoDB from "mongo" namespace.)
        MongooseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                uri: configService.get<string>("mongo.uri"),
            }),
        }),

        // Feature modules.
        SqlModule,
        NosqlModule,
        CompareModule,
    ],
})
/**
 * Class `AppModule` — root module cua ung dung.
 * (EN: Class `AppModule` — application root module.)
 */
export class AppModule {}
