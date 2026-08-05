import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./discussion.module-definition"
import {
    ContentCommentsResolver,
} from "./content-comments/content-comments.resolver"
import {
    ContentCommentsService,
} from "./content-comments/content-comments.service"
import {
    ContentReactionsResolver,
} from "./content-reactions/content-reactions.resolver"
import {
    ContentReactionsService,
} from "./content-reactions/content-reactions.service"

@Module({
    providers: [
        ContentCommentsResolver,
        ContentCommentsService,
        ContentReactionsResolver,
        ContentReactionsService,
    ],
})
/**
 * Aggregates the read-side (query) resolvers of the content discussion feature.
 */
export class DiscussionQueriesModule extends ConfigurableModuleClass {}
