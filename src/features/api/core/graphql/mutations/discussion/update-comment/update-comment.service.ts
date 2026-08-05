import {
    Injectable,
} from "@nestjs/common"
import {
    CommentService,
} from "@modules/bussiness/discussion/comment.service"
import {
    ReactionService,
} from "@modules/bussiness/discussion/reaction.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import {
    mapCommentNode,
} from "../../../shared/discussion/mappers/comment-node"
import {
    CommentNodeObject,
} from "../../../shared/discussion/object-types/comment-node.object"
import type {
    UpdateCommentRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Mutation service that edits a comment and returns its refreshed node.
 */
export class UpdateCommentService {
    constructor(
        private readonly commentService: CommentService,
        private readonly reactionService: ReactionService,
    ) {}

    /**
     * Edits a comment (author only) and re-resolves its aggregates for the response.
     * @param params - Execute params carrying the {@link UpdateCommentRequest} + user.
     * @returns The updated comment node.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<UpdateCommentRequest>): Promise<CommentNodeObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // ownership is enforced inside the domain service; it also fans out the event
        const comment = await this.commentService.updateComment({
            commentId: request.commentId,
            body: request.body,
            user,
        })
        // re-resolve reply count + reactions so the node reflects current aggregates
        const replyCounts = await this.commentService.countReplies([
            comment.id,
        ])
        const reactionSummaries = await this.reactionService.summarizeComments({
            commentIds: [
                comment.id,
            ],
            userId: user.id,
        })
        return mapCommentNode({
            comment,
            replyCount: replyCounts[comment.id] ?? 0,
            reactions: reactionSummaries[comment.id] ?? {
                counts: [],
                total: 0,
                myReaction: null,
            },
        })
    }
}
