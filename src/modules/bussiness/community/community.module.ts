import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./community.module-definition"
import {
    CommunityPostService,
} from "./community-post.service"
import {
    CommunityCommentService,
} from "./community-comment.service"
import {
    CommunityReactionService,
} from "./community-reaction.service"
import {
    CommunityPostQuotaService,
} from "./community-post-quota.service"

@Module({
    providers: [
        CommunityPostService,
        CommunityCommentService,
        CommunityReactionService,
        CommunityPostQuotaService,
    ],
    exports: [
        CommunityPostService,
        CommunityCommentService,
        CommunityReactionService,
        CommunityPostQuotaService,
    ],
})
/**
 * Bussiness module for the community domain (feed posts + threaded comments +
 * reactions). Depends on the globally-provided MembershipService (quota) and
 * NotificationService (reply notifications).
 */
export class CommunityModule extends ConfigurableModuleClass {}
