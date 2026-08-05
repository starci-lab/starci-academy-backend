import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./community.module-definition"
import {
    CommunityFeedResolver,
    CommunityFeedService,
} from "./community-feed"
import {
    CommunityPostResolver,
    CommunityPostQueryService,
} from "./community-post"
import {
    CommunityPostCommentsResolver,
    CommunityPostCommentsService,
} from "./community-post-comments"

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
