import {
    Module,
} from "@nestjs/common"
import {
    QueriesModule,
} from "./queries"
import {
    ConfigurableModuleClass 
} from "./graphql.module-definition"

/**
 * Module for the GraphQL.
 */
@Module({
    imports: [
        QueriesModule.register({
            isGlobal: true,
        }),
    ],
})
export class GraphQLModule extends ConfigurableModuleClass {}
