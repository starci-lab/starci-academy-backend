/**
 * Root module — cấu hình ConfigModule, TypeORM replication, OrdersModule.
 * (EN: Root module — configure ConfigModule, TypeORM replication, OrdersModule.)
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
} from "@2-replication-and-partitioning/config"
import {
    OrderEntity,
} from "@2-replication-and-partitioning/orders/entities"
import {
    OrdersModule,
} from "@2-replication-and-partitioning/orders"

@Module({
    imports: [
        // ConfigModule toàn cục — load registerAs factories.
        // (EN: Global ConfigModule — load registerAs factories.)
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, postgresConfig],
        }),

        // TypeORM replication — master ghi, slave đọc.
        // (EN: TypeORM replication — master writes, slave reads.)
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: "postgres" as const,
                replication: {
                    master: {
                        host: configService.get<string>("postgres.master.host"),
                        port: configService.get<number>("postgres.master.port"),
                        username: configService.get<string>("postgres.master.username"),
                        password: configService.get<string>("postgres.master.password"),
                        database: configService.get<string>("postgres.master.database"),
                    },
                    slaves: [
                        {
                            host: configService.get<string>("postgres.replica.host"),
                            port: configService.get<number>("postgres.replica.port"),
                            username: configService.get<string>("postgres.replica.username"),
                            password: configService.get<string>("postgres.replica.password"),
                            database: configService.get<string>("postgres.replica.database"),
                        },
                    ],
                },
                entities: [OrderEntity],
                // synchronize tắt — schema do init.sql tạo sẵn (bảng phân vùng).
                // (EN: synchronize off — schema created by init.sql (partitioned table).)
                synchronize: false,
            }),
        }),

        OrdersModule,
    ],
})
export class AppModule {}
