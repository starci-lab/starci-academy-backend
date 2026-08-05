import {
    DynamicModule, Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./apollo-client.module-definition"
import {
    ApolloClientService 
} from "./apollo-client.service"

@Module({
})
/**
 * Nest module that provides Apollo Client creation and caching via ApolloClientService.
 *
 * @example
 * ApolloClientModule.register({ isGlobal: true })
 */
export class ApolloClientModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const providers = [ApolloClientService]
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                ...providers,
            ],
            exports: [...providers],
        }
    }
}
