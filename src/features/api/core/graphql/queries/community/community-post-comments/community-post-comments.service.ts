import {
    Injectable,
} from "@nestjs/common"
import {
    CommunityCommentService,
    CommunityReactionService,
} from "@modules/bussiness"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CommunityCommentsPageObject,
    mapCommunityCommentNode,
} from "../../../shared/community"
import type {
    CommunityPostCommentsRequest,
} from "./graphql-types"

@Injectable()
/**
 * Query service for listing a community post's comments. Loads a page of comment
 * rows, then batch-resolves their reply counts + reaction summaries so the client
 * gets ready nodes. Open to everyone (optional auth); `myReaction` only set when
 * authenticated.
 */
export class CommunityPostCommentsService {
    constructor(
        private readonly communityCommentService: CommunityCommentService,
        private readonly communityReactionService: CommunityReactionService,
    ) {}

    /**
     * Lists comments for a post and assembles client-facing nodes.
     * @param params - Execute params carrying the {@link CommunityPostCommentsRequest} + optional user.
     * @returns A page of comment nodes + total count.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<CommunityPostCommentsRequest>): Promise<CommunityCommentsPageObject> {
        // pull the requested page of comments (top-level or replies of one parent)
        const {
            comments,
            total,
        } = await this.communityCommentService.listComments({
            postId: request.postId,
            parentCommentId: request.parentCommentId,
            page: request.page,
            limit: request.limit,
        })
        // collect ids once to batch the two follow-up aggregate queries
        const commentIds = comments.map((comment) => comment.id)
        // direct reply counts per comment (for the "view N replies" affordance)
        const replyCounts = await this.communityCommentService.countReplies(commentIds)
        // reaction summaries per comment from this viewer's perspective
        const reactionSummaries = await this.communityReactionService.summarizeComments({
            commentIds,
            userId: user?.id ?? "",
        })
        // map each row into a node, defaulting missing aggregates defensively
        const nodes = comments.map((comment) => mapCommunityCommentNode({
            comment,
            replyCount: replyCounts[comment.id] ?? 0,
            reactions: reactionSummaries[comment.id] ?? {
                counts: [],
                total: 0,
                myReaction: null,
                viewCount: 0,
                shareCount: 0,
            },
        }))
        return {
            comments: nodes,
            total,
        }
    }
}
