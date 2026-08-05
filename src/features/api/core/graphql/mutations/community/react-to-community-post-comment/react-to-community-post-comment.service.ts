import {
    Injectable,
} from "@nestjs/common"
import {
    CommunityReactionService,
} from "@modules/bussiness/community/community-reaction.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    ReactionSummaryObject,
} from "../../../shared/discussion/object-types/reaction-summary.object"
import type {
    ReactToCommunityPostCommentRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Mutation service that sets/changes/removes the current user's reaction on a comment.
 */
export class ReactToCommunityPostCommentService {
    constructor(
        private readonly communityReactionService: CommunityReactionService,
    ) {}

    /**
     * Applies a reaction change on a community post comment.
     * @param params - Execute params carrying the {@link ReactToCommunityPostCommentRequest} + user.
     * @returns The comment's refreshed reaction summary.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<ReactToCommunityPostCommentRequest>): Promise<ReactionSummaryObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // null/omitted type means "remove my reaction"
        return this.communityReactionService.reactToComment({
            commentId: request.commentId,
            user,
            type: request.type ?? null,
        })
    }
}
