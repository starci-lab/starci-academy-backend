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
import {
    mapCommunityCommentNode,
} from "../../../shared/community/mappers/community-comment-node"
import {
    CommunityCommentNodeObject,
} from "../../../shared/community/object-types/community-comment-node.object"
import type {
    CreateCommunityPostCommentRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Mutation service that creates a comment on a community post and returns its node.
 */
export class CreateCommunityPostCommentService {
    constructor(
        private readonly communityCommentService: CommunityCommentService,
    ) {}

    /**
     * Creates a community post comment (top-level or reply).
     * @param params - Execute params carrying the {@link CreateCommunityPostCommentRequest} + user.
     * @returns The created comment node.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<CreateCommunityPostCommentRequest>): Promise<CommunityCommentNodeObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // persist via the domain service (fans out the event + reply notifications)
        const comment = await this.communityCommentService.createComment({
            postId: request.postId,
            parentCommentId: request.parentCommentId,
            body: request.body,
            user,
        })
        // a brand-new comment has no replies and no reactions yet
        return mapCommunityCommentNode({
            comment,
            replyCount: 0,
            reactions: {
                counts: [],
                total: 0,
                myReaction: null,
                viewCount: 0,
                shareCount: 0,
            },
        })
    }
}
