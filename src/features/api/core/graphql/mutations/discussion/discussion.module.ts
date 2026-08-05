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
import {
    ReactToActivityResolver,
    ReactToActivityService,
} from "./react-to-activity"

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
        ReactToActivityResolver,
        ReactToActivityService,
    ],
})
/**
 * Aggregates the write-side (mutation) resolvers of the content discussion feature.
 */
export class DiscussionMutationsModule extends ConfigurableModuleClass {}
