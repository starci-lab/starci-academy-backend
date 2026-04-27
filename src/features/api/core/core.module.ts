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

/**
 * Module for the Core.
 */
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
export class CoreModule extends ConfigurableModuleClass {
}