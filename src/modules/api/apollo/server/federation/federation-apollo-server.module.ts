import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./federation-apollo-server.module-definition"

@Module({
})
/**
 * Apollo Federation subgraph stub. `register()` currently imports nothing —
 * selecting {@link ApolloServerType.Federation} would serve no schema until wired.
 */
export class FederationApolloServerModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE) {
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            imports: [],
        }
    }
}

