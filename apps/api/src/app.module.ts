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
import {
    PrimaryPostgresqlModule
} from "@modules/databases"
import {
    S3Module
} from "@modules/s3"
import {
    CdnSynchronizerModule
} from "@features/cdn-synchronizer"
import {
    ScheduleModule
} from "@nestjs/schedule"
import {
    ApiModule
} from "@features/api"

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
            /** Schedule module. */
            ScheduleModule.forRoot(),
            /** Winston module. */
            WinstonModule.register(
                {
                    serviceName: ServiceName.Api,
                    level: WinstonLevel.Verbose,
                    isGlobal: true,
                }
            ),
            /** Mount filesystem module. */
            FilesystemModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** S3 module. */
            S3Module.register(
                {
                    isGlobal: true,
                }
            ),
            /** Primary PostgreSQL module. */
            PrimaryPostgresqlModule.register(
                {
                    isGlobal: true,
                    withSeeders: {
                        manualSeed: false,
                    }
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
            /** Cdn Synchronizer module. */
            CdnSynchronizerModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Api module. */
            ApiModule.register(
                {
                    isGlobal: true,
                }
            ),
        ],
    }
)
export class AppModule { }
