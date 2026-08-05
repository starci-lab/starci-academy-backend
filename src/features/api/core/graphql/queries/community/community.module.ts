import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./community.module-definition"
import {
    CommunityFeedResolver,
} from "./community-feed/community-feed.resolver"
import {
    CommunityFeedService,
} from "./community-feed/community-feed.service"
import {
    CommunityPostResolver,
} from "./community-post/community-post.resolver"
import {
    CommunityPostQueryService,
} from "./community-post/community-post.service"
import {
    CommunityPostCommentsResolver,
} from "./community-post-comments/community-post-comments.resolver"
import {
    CommunityPostCommentsService,
} from "./community-post-comments/community-post-comments.service"

@Module({
    providers: [
        CommunityFeedResolver,
        CommunityFeedService,
        CommunityPostResolver,
        CommunityPostQueryService,
        CommunityPostCommentsResolver,
        CommunityPostCommentsService,
    ],
})
/**
 * Aggregates the read-side (query) resolvers of the community feature.
 */
export class CommunityQueriesModule extends ConfigurableModuleClass {}
