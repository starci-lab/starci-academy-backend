/**
 * Module gốc — ConfigModule, SentryModule, SentryGlobalFilter và OrdersModule.
 * (EN: Root module — ConfigModule, SentryModule, SentryGlobalFilter and OrdersModule.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    APP_FILTER,
} from "@nestjs/core"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    SentryGlobalFilter,
    SentryModule,
} from "@sentry/nestjs/setup"
import {
    appConfig,
    loggingConfig,
} from "./config"
import {
    OrdersModule,
} from "./orders"

@Module({
    imports: [
        // ConfigModule toàn cục — load cấu hình app + logging từ env.
        // (EN: Global ConfigModule — loads app + logging config from env.)
        ConfigModule.forRoot({
            isGlobal: true,
            load: [
                appConfig,
                loggingConfig,
            ],
        }),
        // SentryModule — đăng ký Sentry instrumentation vào Nest DI.
        // (EN: SentryModule — registers Sentry instrumentation into Nest DI.)
        SentryModule.forRoot(),
        // OrdersModule — feature module chứa endpoint demo log/error.
        // (EN: OrdersModule — feature module containing demo log/error endpoints.)
        OrdersModule,
    ],
    providers: [
        // SentryGlobalFilter — bắt mọi exception chưa xử lý và gửi tới Sentry.
        // (EN: SentryGlobalFilter — catches all unhandled exceptions and reports to Sentry.)
        {
            provide: APP_FILTER,
            useClass: SentryGlobalFilter,
        },
    ],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
