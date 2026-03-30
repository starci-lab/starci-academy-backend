import {
    EnvModule
} from "@modules/env"
import {
    Module
} from "@nestjs/common"
import {
    ValidationPipe 
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
    PrimaryPostgreSQLModule
} from "@modules/databases"
import {
    S3Module
} from "@modules/s3"
import {
    PayOSModule
} from "@modules/payos"
import {
    CdnSynchronizerModule
} from "@features/cdn-synchronizer"
import {
    ScheduleModule
} from "@nestjs/schedule"
import {
    ApiModule
} from "@features/api"
import {
    AxiosModule
} from "@modules/axios"
import {
    KeycloakModule
} from "@modules/keycloak"
import {
    JwtModule
} from "@nestjs/jwt"
import {
    APP_PIPE 
} from "@nestjs/core"
import {
    BullModule
} from "@modules/bullmq"
import {
    BussinessModule 
} from "@modules/bussiness"
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
            /** Axios module. */
            AxiosModule.register(
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
            /** Jwt module. */
            JwtModule.register({
                global: true,
            }),
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
            /** PayOS module (uses S3 for snapshots). */
            PayOSModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** BullMQ module. */
            BullModule.forRoot(
                {
                    isGlobal: true,
                }
            ),
            /** Primary PostgreSQL module. */
            PrimaryPostgreSQLModule.register(
                {
                    isGlobal: true,
                    withSeeders: {
                        manualSeed: false,
                    }
                }
            ),
            /** Bussiness module. */
            BussinessModule.register(
                {
                    isGlobal: true,
                }
            ),
            /** Keycloak module. */
            KeycloakModule.register(
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
        providers: [
            {
                provide: APP_PIPE,
                useClass: ValidationPipe,
            },
        ],
    }
)
export class AppModule { }
