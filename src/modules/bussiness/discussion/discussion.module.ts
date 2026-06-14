import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./discussion.module-definition"
import {
    CommentService,
} from "./comment.service"
import {
    ReactionService,
} from "./reaction.service"

/**
 * Bussiness module for the lesson-content discussion domain (comments +
 * reactions). The content-engagement projection (service + CDC listener) now
 * lives in the dedicated `projections` module; ReactionService injects it from
 * there (globally provided).
 */
@Module({
    providers: [
        CommentService,
        ReactionService,
    ],
    exports: [
        CommentService,
        ReactionService,
    ],
})
export class DiscussionModule extends ConfigurableModuleClass {
}
