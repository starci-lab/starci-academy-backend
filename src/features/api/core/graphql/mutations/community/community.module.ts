import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./community.module-definition"
import {
    CreateCommunityPostResolver,
    CreateCommunityPostService,
} from "./create-community-post"
import {
    UpdateCommunityPostResolver,
    UpdateCommunityPostService,
} from "./update-community-post"
import {
    DeleteCommunityPostResolver,
    DeleteCommunityPostService,
} from "./delete-community-post"
import {
    CreateCommunityPostCommentResolver,
    CreateCommunityPostCommentService,
} from "./create-community-post-comment"
import {
    UpdateCommunityPostCommentResolver,
    UpdateCommunityPostCommentService,
} from "./update-community-post-comment"
import {
    DeleteCommunityPostCommentResolver,
    DeleteCommunityPostCommentService,
} from "./delete-community-post-comment"
import {
    ReactToCommunityPostResolver,
    ReactToCommunityPostService,
} from "./react-to-community-post"
import {
    ReactToCommunityPostCommentResolver,
    ReactToCommunityPostCommentService,
} from "./react-to-community-post-comment"
import {
    SetCommunityPostPinnedResolver,
    SetCommunityPostPinnedService,
} from "./set-community-post-pinned"

/**
 * Aggregates the write-side (mutation) resolvers of the community feature.
 */
@Module({
    providers: [
        CreateCommunityPostResolver,
        CreateCommunityPostService,
        UpdateCommunityPostResolver,
        UpdateCommunityPostService,
        DeleteCommunityPostResolver,
        DeleteCommunityPostService,
        CreateCommunityPostCommentResolver,
        CreateCommunityPostCommentService,
        UpdateCommunityPostCommentResolver,
        UpdateCommunityPostCommentService,
        DeleteCommunityPostCommentResolver,
        DeleteCommunityPostCommentService,
        ReactToCommunityPostResolver,
        ReactToCommunityPostService,
        ReactToCommunityPostCommentResolver,
        ReactToCommunityPostCommentService,
        SetCommunityPostPinnedResolver,
        SetCommunityPostPinnedService,
    ],
})
export class CommunityMutationsModule extends ConfigurableModuleClass {}
