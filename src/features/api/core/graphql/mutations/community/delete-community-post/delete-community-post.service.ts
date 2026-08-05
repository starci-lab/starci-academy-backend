import {
    Injectable,
} from "@nestjs/common"
import {
    CommunityPostService,
} from "@modules/bussiness/community/community-post.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    DeletedCommunityPostObject,
} from "../../../shared/community/object-types/community-comments-page.object"
import type {
    DeleteCommunityPostRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Mutation service that soft-deletes a community post (author-only).
 */
export class DeleteCommunityPostService {
    constructor(
        private readonly communityPostService: CommunityPostService,
    ) {}

    /**
     * Soft-deletes a community post.
     * @param params - Execute params carrying the {@link DeleteCommunityPostRequest} + user.
     * @returns The soft-deleted post id.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<DeleteCommunityPostRequest>): Promise<DeletedCommunityPostObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // soft-delete via the domain service (ownership guard + event fan-out inside)
        return this.communityPostService.softDeletePost({
            postId: request.postId,
            user,
        })
    }
}
