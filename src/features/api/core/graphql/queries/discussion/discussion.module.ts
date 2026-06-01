import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./discussion.module-definition"
import {
    ContentCommentsResolver,
    ContentCommentsService,
} from "./content-comments"
import {
    ContentReactionsResolver,
    ContentReactionsService,
} from "./content-reactions"

/**
 * Aggregates the read-side (query) resolvers of the content discussion feature.
 */
@Module({
    providers: [
        ContentCommentsResolver,
        ContentCommentsService,
        ContentReactionsResolver,
        ContentReactionsService,
    ],
})
export class DiscussionQueriesModule extends ConfigurableModuleClass {}
