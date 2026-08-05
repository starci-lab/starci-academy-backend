import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./discussion.module-definition"
import {
    CreateCommentResolver,
} from "./create-comment/create-comment.resolver"
import {
    CreateCommentService,
} from "./create-comment/create-comment.service"
import {
    UpdateCommentResolver,
} from "./update-comment/update-comment.resolver"
import {
    UpdateCommentService,
} from "./update-comment/update-comment.service"
import {
    DeleteCommentResolver,
} from "./delete-comment/delete-comment.resolver"
import {
    DeleteCommentService,
} from "./delete-comment/delete-comment.service"
import {
    ReactToContentResolver,
} from "./react-to-content/react-to-content.resolver"
import {
    ReactToContentService,
} from "./react-to-content/react-to-content.service"
import {
    ReactToCommentResolver,
} from "./react-to-comment/react-to-comment.resolver"
import {
    ReactToCommentService,
} from "./react-to-comment/react-to-comment.service"
import {
    ReactToActivityResolver,
} from "./react-to-activity/react-to-activity.resolver"
import {
    ReactToActivityService,
} from "./react-to-activity/react-to-activity.service"

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
