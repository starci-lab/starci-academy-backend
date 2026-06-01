import {
    Injectable,
} from "@nestjs/common"
import {
    ReactionService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import type {
    ReactionSummaryObject,
} from "../../../shared/discussion"
import type {
    ReactToCommentRequest,
} from "./graphql-types"

/**
 * Mutation service that sets/changes/removes the current user's reaction on a comment.
 */
@Injectable()
export class ReactToCommentService {
    constructor(
        private readonly reactionService: ReactionService,
    ) {}

    /**
     * Applies a reaction change on a comment.
     * @param params - Execute params carrying the {@link ReactToCommentRequest} + user.
     * @returns The comment's refreshed reaction summary.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<ReactToCommentRequest>): Promise<ReactionSummaryObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // null/omitted type means "remove my reaction"
        return this.reactionService.reactToComment({
            commentId: request.commentId,
            user,
            type: request.type ?? null,
        })
    }
}
