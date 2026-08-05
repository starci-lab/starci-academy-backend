import {
    Module 
} from "@nestjs/common"
import {
    HttpModule,
} from "./http/http.module"
import {
    GraphQLModule,
} from "./graphql/graphql.module"
import {
    ConfigurableModuleClass 
} from "./core.module-definition"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"

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