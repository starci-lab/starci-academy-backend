/**
 * Root module — ConfigModule, SentryModule, SentryGlobalFilter and OrdersModule.
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
        // Global ConfigModule — loads app + logging config from env.
        ConfigModule.forRoot({
            isGlobal: true,
            load: [
                appConfig,
                loggingConfig,
            ],
        }),
        // SentryModule — registers Sentry instrumentation into Nest DI.
        SentryModule.forRoot(),
        // OrdersModule — feature module containing demo log/error endpoints.
        OrdersModule,
    ],
    providers: [
        // SentryGlobalFilter — catches all unhandled exceptions and reports to Sentry.
        {
            provide: APP_FILTER,
            useClass: SentryGlobalFilter,
        },
    ],
})
/**
 * Class `AppModule` — lesson lab component.
 */
export class AppModule {}
