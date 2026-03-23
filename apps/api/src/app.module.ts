import {
    EnvModule
} from "@modules/env"
import {
    Module
} from "@nestjs/common"
import {
    WinstonModule,
    WinstonLevel
} from "@modules/winston"
import {
    ServiceName
} from "@modules/common"
import {
    RedisInstanceKey,
    RedisModule
} from "@modules/native"
import {
    ThrottlerModule
} from "@modules/throttler"
import {
    FilesystemModule
} from "@modules/filesystem"
import {
    SentryModule
} from "@modules/sentry"
import {
    MixinModule 
} from "@modules/mixin"

/**
 * The main module for the application.
 */
@Module(
    {
        imports: [
            /** Environment module. */
            EnvModule.forRoot(),
            /** Winston module. */
            WinstonModule.register(
                {
                    serviceName: ServiceName.Api,
                    level: WinstonLevel.Info,
                }
            ),
            /** Mixin module. */
            MixinModule.register({
                isGlobal: true,
            }),
            /** Sentry module. */
            SentryModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Mount filesystem module. */
            FilesystemModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** IoRedis module. */
            RedisModule.register(
                {
                    instanceKeys: [
                        RedisInstanceKey.Adapter,
                    ],
                    isGlobal: true,
                }
            ),
            /** Throttler module. */
            ThrottlerModule.register(
                {
                    isGlobal: true,
                }
            ),
        ],
    }
)
export class AppModule { }
