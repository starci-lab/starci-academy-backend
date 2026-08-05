import {
    Module 
} from "@nestjs/common"
import {
    HttpModule 
} from "./http"
import {
    GraphQLModule,
} from "./graphql"
import {
    ConfigurableModuleClass 
} from "./core.module-definition"
import {
    ApolloServerModule,
    ApolloServerType,
} from "@modules/api"

@Module({
    imports: [
        ApolloServerModule.register(
            {
                type: ApolloServerType.Monolithic,
                useServices: true,
            }
        ),
        HttpModule.register({
            isGlobal: true,
        }),
        GraphQLModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Composes HTTP + GraphQL under one monolithic Apollo server so the API app boots a single
 * surface instead of each protocol registering itself.
 */
export class CoreModule extends ConfigurableModuleClass {
}