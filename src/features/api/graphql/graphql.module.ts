import {
    Module,
} from "@nestjs/common"
import {
    UtilsModule 
} from "./utils"
import {
    MutationsModule,
} from "./mutations"
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
        UtilsModule.register({
            isGlobal: true,
        }),
        QueriesModule.register({
            isGlobal: true,
        }),
        MutationsModule.register({
            isGlobal: true,
        }),
    ],
})
export class GraphQLModule extends ConfigurableModuleClass {}
