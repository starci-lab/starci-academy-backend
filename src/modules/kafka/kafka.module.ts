import {
    type DynamicModule,
    Module,
    type Provider,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    type OPTIONS_TYPE,
} from "./kafka.module-definition"
import {
    createKafkaProvider,
} from "./kafka.providers"
import {
    KafkaService,
} from "./kafka.service"

/**
 * Infrastructure module exposing a single shared Kafka client + {@link KafkaService}.
 * Register once (typically `isGlobal: true`) so every CDC/event listener injects
 * the same {@link KafkaService} instead of constructing its own broker client.
 *
 * @example
 * // app.module.ts
 * KafkaModule.register({ isGlobal: true })
 */
@Module({
})
export class KafkaModule extends ConfigurableModuleClass {
    /**
     * Build the dynamic module, appending the Kafka client provider + service to
     * whatever the configurable builder produced and exporting them.
     *
     * @param options - {@link OPTIONS_TYPE} (carries the `isGlobal` extra).
     * @returns The composed dynamic module.
     */
    public static register(options: typeof OPTIONS_TYPE): DynamicModule {
        // start from the configurable-module definition (applies the isGlobal flag)
        const dynamicModule = super.register(options)
        // the broker client provider + the service that wraps it
        const providers: Array<Provider> = [
            createKafkaProvider(),
            KafkaService,
        ]
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                ...providers,
            ],
            // export only the service — the raw client stays an internal detail
            exports: [
                KafkaService,
            ],
        }
    }
}
