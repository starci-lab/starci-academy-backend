import {
    Module,
} from "@nestjs/common"
import {
    MutationsModule,
} from "./mutations/mutations.module"
import {
    QueriesModule,
} from "./queries/queries.module"
import {
    ConfigurableModuleClass 
} from "./graphql.module-definition"

@Module({
    imports: [
        QueriesModule.register({
            isGlobal: true,
        }),
        MutationsModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Registers Queries and Mutations globally so operation modules can contribute leaves
 * without each one re-wiring the GraphQL server.
 */
export class GraphQLModule extends ConfigurableModuleClass {}
