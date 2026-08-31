import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./community.module-definition"
import {
    CreateCommunityPostResolver,
} from "./create-community-post/create-community-post.resolver"
import {
    CreateCommunityPostService,
} from "./create-community-post/create-community-post.service"
import {
    UpdateCommunityPostResolver,
} from "./update-community-post/update-community-post.resolver"
import {
    UpdateCommunityPostService,
} from "./update-community-post/update-community-post.service"
import {
    DeleteCommunityPostResolver,
} from "./delete-community-post/delete-community-post.resolver"
import {
    DeleteCommunityPostService,
} from "./delete-community-post/delete-community-post.service"
import {
    CreateCommunityPostCommentResolver,
} from "./create-community-post-comment/create-community-post-comment.resolver"
import {
    CreateCommunityPostCommentService,
} from "./create-community-post-comment/create-community-post-comment.service"
import {
    UpdateCommunityPostCommentResolver,
} from "./update-community-post-comment/update-community-post-comment.resolver"
import {
    UpdateCommunityPostCommentService,
} from "./update-community-post-comment/update-community-post-comment.service"
import {
    DeleteCommunityPostCommentResolver,
} from "./delete-community-post-comment/delete-community-post-comment.resolver"
import {
    DeleteCommunityPostCommentService,
} from "./delete-community-post-comment/delete-community-post-comment.service"
import {
    ReactToCommunityPostResolver,
} from "./react-to-community-post/react-to-community-post.resolver"
import {
    ReactToCommunityPostService,
} from "./react-to-community-post/react-to-community-post.service"
import {
    ReactToCommunityPostCommentResolver,
} from "./react-to-community-post-comment/react-to-community-post-comment.resolver"
import {
    ReactToCommunityPostCommentService,
} from "./react-to-community-post-comment/react-to-community-post-comment.service"
import {
    SetCommunityPostPinnedResolver,
} from "./set-community-post-pinned/set-community-post-pinned.resolver"
import {
    SetCommunityPostPinnedService,
} from "./set-community-post-pinned/set-community-post-pinned.service"
import { CourseCommunityMutationsResolver } from "./course-community/course-community.resolver"
import { CourseCommunityApiService } from "../../shared/community/course-community-api.service"

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
        CourseCommunityMutationsResolver,
        CourseCommunityApiService,
    ],
})
/**
 * Aggregates the write-side (mutation) resolvers of the community feature.
 */
export class CommunityMutationsModule extends ConfigurableModuleClass {}
