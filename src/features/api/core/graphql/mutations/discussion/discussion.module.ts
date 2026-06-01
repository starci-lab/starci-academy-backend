import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./discussion.module-definition"
import {
    CreateCommentResolver,
    CreateCommentService,
} from "./create-comment"
import {
    UpdateCommentResolver,
    UpdateCommentService,
} from "./update-comment"
import {
    DeleteCommentResolver,
    DeleteCommentService,
} from "./delete-comment"
import {
    ReactToContentResolver,
    ReactToContentService,
} from "./react-to-content"
import {
    ReactToCommentResolver,
    ReactToCommentService,
} from "./react-to-comment"

/**
 * Aggregates the write-side (mutation) resolvers of the content discussion feature.
 */
@Module({
    providers: [
        CreateCommentResolver,
        CreateCommentService,
        UpdateCommentResolver,
        UpdateCommentService,
        DeleteCommentResolver,
        DeleteCommentService,
        ReactToContentResolver,
        ReactToContentService,
        ReactToCommentResolver,
        ReactToCommentService,
    ],
})
export class DiscussionMutationsModule extends ConfigurableModuleClass {}
