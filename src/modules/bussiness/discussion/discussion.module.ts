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
 * Bussiness module for the lesson-content discussion domain (comments + reactions).
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
