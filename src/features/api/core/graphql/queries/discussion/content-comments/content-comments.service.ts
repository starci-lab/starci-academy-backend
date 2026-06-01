import {
    Injectable,
} from "@nestjs/common"
import {
    CommentService,
    ReactionService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CommentsPageObject,
    mapCommentNode,
} from "../../../shared/discussion"
import type {
    ContentCommentsRequest,
} from "./graphql-types"

/**
 * Query service for listing a content's comments. Loads a page of comment rows, then
 * batch-resolves their reply counts + reaction summaries so the client gets ready nodes.
 */
@Injectable()
export class ContentCommentsService {
    constructor(
        private readonly commentService: CommentService,
        private readonly reactionService: ReactionService,
    ) {}

    /**
     * Lists comments for a content and assembles client-facing nodes.
     * @param params - Execute params carrying the {@link ContentCommentsRequest} + user.
     * @returns A page of comment nodes + total count.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<ContentCommentsRequest>): Promise<CommentsPageObject> {
        // guards already require auth, but narrow the optional user for safety
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // pull the requested page of comments (top-level or replies of one parent)
        const {
            comments,
            total,
        } = await this.commentService.listComments({
            contentId: request.contentId,
            parentCommentId: request.parentCommentId,
            page: request.page,
            limit: request.limit,
        })
        // collect ids once to batch the two follow-up aggregate queries
        const commentIds = comments.map((comment) => comment.id)
        // direct reply counts per comment (for the "view N replies" affordance)
        const replyCounts = await this.commentService.countReplies(commentIds)
        // reaction summaries per comment from this viewer's perspective
        const reactionSummaries = await this.reactionService.summarizeComments({
            commentIds,
            userId: user.id,
        })
        // map each row into a node, defaulting missing aggregates defensively
        const nodes = comments.map((comment) => mapCommentNode({
            comment,
            replyCount: replyCounts[comment.id] ?? 0,
            reactions: reactionSummaries[comment.id] ?? {
                counts: [],
                total: 0,
                myReaction: null,
            },
        }))
        return {
            comments: nodes,
            total,
        }
    }
}
