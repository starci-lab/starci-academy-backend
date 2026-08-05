import {
    Injectable,
} from "@nestjs/common"
import {
    CommentService,
} from "@modules/bussiness/discussion/comment.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    DeletedCommentObject,
} from "../../../shared/discussion/object-types/comments-page.object"
import type {
    DeleteCommentRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Mutation service that soft-deletes a comment (author only).
 */
export class DeleteCommentService {
    constructor(
        private readonly commentService: CommentService,
    ) {}

    /**
     * Soft-deletes a comment.
     * @param params - Execute params carrying the {@link DeleteCommentRequest} + user.
     * @returns The deleted comment id wrapper.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<DeleteCommentRequest>): Promise<DeletedCommentObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // ownership is enforced inside the domain service; it also fans out the event
        return this.commentService.softDeleteComment({
            commentId: request.commentId,
            user,
        })
    }
}
