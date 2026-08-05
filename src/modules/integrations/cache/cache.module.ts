
import {
    DynamicModule, Module, Provider 
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./cache.module-definition"
import {
    createRedisCacheManagerProvider, 
    createMemoryCacheManagerProvider 
} from "./cache.providers"
import {
    AiPingCacheService,
} from "./ai-ping-cache.service"
import {
    AiModelLatencyCacheService,
} from "./ai-model-latency-cache.service"
import {
    CacheService
} from "./cache.service"

@Module({
})
/**
 * Registers Redis + in-process cache managers and {@link CacheService}. Import
 * once (typically global) so every feature shares the same stores -- a second
 * manager would split TTLs/invalidation and serve stale hits.
 */
export class CacheModule extends ConfigurableModuleClass {
    static register(
        options: typeof OPTIONS_TYPE
    ): DynamicModule {
        const dynamicModule = super.register(options)
        const providers: Array<Provider> = [
            createRedisCacheManagerProvider(),
            createMemoryCacheManagerProvider()
        ]
        return {
            ...dynamicModule,
            providers: [...dynamicModule.providers || [],
                ...providers,
                CacheService,
                AiPingCacheService,
                AiModelLatencyCacheService,
            ],
            exports: [
                CacheService,
                AiPingCacheService,
                AiModelLatencyCacheService,
            ],
        }
    }
}
