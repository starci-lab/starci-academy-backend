import {
    Injectable,
} from "@nestjs/common"
import {
    CommunityCommentService,
} from "@modules/bussiness/community/community-comment.service"
import {
    CommunityReactionService,
} from "@modules/bussiness/community/community-reaction.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import {
    mapCommunityCommentNode,
} from "../../../shared/community/mappers/community-comment-node"
import {
    CommunityCommentNodeObject,
} from "../../../shared/community/object-types/community-comment-node.object"
import type {
    UpdateCommunityPostCommentRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Mutation service that edits a community post comment's body (author-only) and
 * returns the refreshed node.
 */
export class UpdateCommunityPostCommentService {
    constructor(
        private readonly communityCommentService: CommunityCommentService,
        private readonly communityReactionService: CommunityReactionService,
    ) {}

    /**
     * Edits a community post comment and re-assembles its node with current aggregates.
     * @param params - Execute params carrying the {@link UpdateCommunityPostCommentRequest} + user.
     * @returns The updated comment node.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<UpdateCommunityPostCommentRequest>): Promise<CommunityCommentNodeObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // edit via the domain service (ownership guard + event fan-out inside)
        const comment = await this.communityCommentService.updateComment({
            commentId: request.commentId,
            body: request.body,
            user,
        })
        // refresh the aggregates so the returned node reflects current state
        const replyCounts = await this.communityCommentService.countReplies([
            comment.id,
        ])
        const reactionSummaries = await this.communityReactionService.summarizeComments({
            commentIds: [
                comment.id,
            ],
            userId: user.id,
        })
        return mapCommunityCommentNode({
            comment,
            replyCount: replyCounts[comment.id] ?? 0,
            reactions: reactionSummaries[comment.id] ?? {
                counts: [],
                total: 0,
                myReaction: null,
                viewCount: 0,
                shareCount: 0,
            },
        })
    }
}
