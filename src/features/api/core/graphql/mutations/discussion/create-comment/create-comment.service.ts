import {
    Injectable,
} from "@nestjs/common"
import {
    CommentService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CommentNodeObject,
    mapCommentNode,
} from "../../../shared/discussion"
import type {
    CreateCommentRequest,
} from "./graphql-types"

/**
 * Mutation service that creates a comment and returns its client-facing node.
 */
@Injectable()
export class CreateCommentService {
    constructor(
        private readonly commentService: CommentService,
    ) {}

    /**
     * Creates a comment (top-level or reply) on a content.
     * @param params - Execute params carrying the {@link CreateCommentRequest} + user.
     * @returns The created comment node.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<CreateCommentRequest>): Promise<CommentNodeObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // persist the comment via the domain service (also fans out the realtime event)
        const comment = await this.commentService.createComment({
            contentId: request.contentId,
            parentCommentId: request.parentCommentId,
            body: request.body,
            user,
        })
        // a brand-new comment has no replies and no reactions yet
        return mapCommentNode({
            comment,
            replyCount: 0,
            reactions: {
                counts: [],
                total: 0,
                myReaction: null,
            },
        })
    }
}
