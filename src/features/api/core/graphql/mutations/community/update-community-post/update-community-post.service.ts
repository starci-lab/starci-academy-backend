import {
    Injectable,
} from "@nestjs/common"
import {
    CommunityCommentService,
    CommunityPostService,
    CommunityReactionService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CommunityPostNodeObject,
    mapCommunityPostNode,
} from "../../../shared/community"
import type {
    UpdateCommunityPostRequest,
} from "./graphql-types"

/**
 * Mutation service that edits a community post's body (author-only) and returns
 * the refreshed client-facing node.
 */
@Injectable()
export class UpdateCommunityPostService {
    constructor(
        private readonly communityPostService: CommunityPostService,
        private readonly communityReactionService: CommunityReactionService,
        private readonly communityCommentService: CommunityCommentService,
    ) {}

    /**
     * Edits a community post and re-assembles its node with current aggregates.
     * @param params - Execute params carrying the {@link UpdateCommunityPostRequest} + user.
     * @returns The updated post node.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<UpdateCommunityPostRequest>): Promise<CommunityPostNodeObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // edit via the domain service (ownership guard + event fan-out inside)
        const post = await this.communityPostService.updatePost({
            postId: request.postId,
            body: request.body,
            user,
        })
        // refresh the aggregates so the returned node reflects current state
        const reactionSummaries = await this.communityReactionService.summarizePosts({
            postIds: [
                post.id,
            ],
            userId: user.id,
        })
        const commentCounts = await this.communityCommentService.countCommentsByPosts([
            post.id,
        ])
        return mapCommunityPostNode({
            post,
            reactions: reactionSummaries[post.id] ?? {
                counts: [],
                total: 0,
                myReaction: null,
                viewCount: 0,
                shareCount: 0,
            },
            commentCount: commentCounts[post.id] ?? 0,
            viewerId: user.id,
        })
    }
}
