import {
    DynamicModule, Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass, OPTIONS_TYPE 
} from "./ioredis.module-definition"
import {
    createIoRedisProvider,
    createIoRedisShutdownProvider,
} from "./ioredis.providers"

@Module({
})
/**
 * Registers one IoRedis/Valkey client per requested {@link IoRedisInstanceKey}
 * so queues, throttles, the socket adapter, and cache never share a connection.
 */
export class IoRedisModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const { instanceKeys } = options
        const providers = instanceKeys.map(instanceKey =>
            createIoRedisProvider(instanceKey)
        )
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers || []),
                ...providers,
                ...instanceKeys.map(
                    instanceKey => createIoRedisShutdownProvider(instanceKey),
                ),
            ],
            exports: [
                ...providers,
            ],
        }
    }
}
