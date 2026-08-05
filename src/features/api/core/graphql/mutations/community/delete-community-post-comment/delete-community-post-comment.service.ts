import {
    Injectable,
} from "@nestjs/common"
import {
    CommunityCommentService,
} from "@modules/bussiness/community/community-comment.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    DeletedCommunityCommentObject,
} from "../../../shared/community/object-types/community-comments-page.object"
import type {
    DeleteCommunityPostCommentRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Mutation service that soft-deletes a community post comment (author-only).
 */
export class DeleteCommunityPostCommentService {
    constructor(
        private readonly communityCommentService: CommunityCommentService,
    ) {}

    /**
     * Soft-deletes a community post comment.
     * @param params - Execute params carrying the {@link DeleteCommunityPostCommentRequest} + user.
     * @returns The soft-deleted comment id.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<DeleteCommunityPostCommentRequest>): Promise<DeletedCommunityCommentObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // soft-delete via the domain service (ownership guard + event fan-out inside)
        return this.communityCommentService.softDeleteComment({
            commentId: request.commentId,
            user,
        })
    }
}
