import type {
    Provider 
} from "@nestjs/common"
import {
    DynamicModule, Module 
} from "@nestjs/common"
import {
    InstanceService,
} from "@modules/lib/mixin/instance.service"
import {
    NatsBridgeService 
} from "./nats-bridge.service"
import {
    NatsMessageFactoryService 
} from "./nats-message-factory.service"
import {
    NatsProducerService 
} from "./producer.service"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./nats.module-definition"
import {
    createNatsProvider 
} from "./nats.providers"

@Module({
})
/**
 * Registers NATS connection, producer, consumer and EventEmitter bridge so
 * cross-pod events reach every instance instead of dying in-process.
 */
export class NatsModule extends ConfigurableModuleClass {
    public static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)

        const providers: Array<Provider> = [
            createNatsProvider(),
            NatsProducerService,
            NatsMessageFactoryService,
            NatsBridgeService,
            InstanceService,
        ]

        return {
            ...dynamicModule,
            providers: [...(dynamicModule.providers ?? []),
                ...providers],
            exports: providers,
        }
    }
}
