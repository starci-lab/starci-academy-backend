import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    createQdrantClientProvider,
} from "./qdrant.providers"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./qdrant.module-definition"

/**
 * Module registering a shared Qdrant REST client and service wrappers.
 */
@Module({
})
export class QdrantModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const qdrantClientProvider = createQdrantClientProvider()
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                qdrantClientProvider,
            ],
            exports: [
                qdrantClientProvider,
            ],
        }
    }
}
