import {
    DynamicModule, Module
} from "@nestjs/common"
import {
    APP_GUARD
} from "@nestjs/core"
import {
    ConfigurableModuleClass, OPTIONS_TYPE
} from "./throttler.module-definition"
import {
    ThrottlerModule as ThrottlerCoreModule
} from "@nestjs/throttler"
import {
    ThrottlerStorageRedisService,
} from "@nest-lab/throttler-storage-redis"
import {
    createIoRedisKey, IoRedisInstanceKey,
    IoRedisModule
} from "@modules/native"
import {
    RedisOrCluster
} from "@modules/native"
import Redis from "ioredis"
import {
    getModuleThrottlers
} from "./config"
import {
    ThrottlerBehindProxyGuard
} from "./guards"
/**
 * The module for the Throttler.
 */
@Module({
})
export class ThrottlerModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const throttlerCoreModule =  ThrottlerCoreModule.forRootAsync(
            {
                imports: [
                    IoRedisModule.register({
                        instanceKeys: [
                            IoRedisInstanceKey.Throttler,
                        ],
                    }),
                ],
                inject: [createIoRedisKey(IoRedisInstanceKey.Throttler)],
                useFactory: (redis: RedisOrCluster) => ({
                    storage:(() => {
                        if (redis instanceof Redis) {
                            return new ThrottlerStorageRedisService(redis)
                        }
                        return new ThrottlerStorageRedisService(redis)
                    })(),
                    // named windows with a no-op default limit → NO global cap;
                    // each endpoint opts in via @Throttle({ short, long })
                    throttlers: getModuleThrottlers(),
                }),
            })
        return {
            ...dynamicModule,
            imports: [
                throttlerCoreModule,
            ],
            providers: [
                // preserve any providers the base register() created (options token)
                ...(dynamicModule.providers ?? []),
                // register the rate-limit guard app-wide so all REST + GraphQL
                // endpoints are throttled by default (no per-route opt-in needed)
                {
                    provide: APP_GUARD,
                    useClass: ThrottlerBehindProxyGuard,
                },
            ],
        }
    }
}