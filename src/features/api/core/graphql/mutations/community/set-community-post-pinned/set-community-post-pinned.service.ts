import {
    Injectable,
} from "@nestjs/common"
import {
    CommunityCommentService,
} from "@modules/bussiness/community/community-comment.service"
import {
    CommunityPostService,
} from "@modules/bussiness/community/community-post.service"
import {
    CommunityReactionService,
} from "@modules/bussiness/community/community-reaction.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import {
    mapCommunityPostNode,
} from "../../../shared/community/mappers/community-post-node"
import {
    CommunityPostNodeObject,
} from "../../../shared/community/object-types/community-post-node.object"
import type {
    SetCommunityPostPinnedRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Mutation service that pins/unpins a community post (founder-only) and returns the
 * refreshed client-facing node.
 */
export class SetCommunityPostPinnedService {
    constructor(
        private readonly communityPostService: CommunityPostService,
        private readonly communityReactionService: CommunityReactionService,
        private readonly communityCommentService: CommunityCommentService,
    ) {}

    /**
     * Pins/unpins a post and re-assembles its node with current aggregates.
     * @param params - Execute params carrying the {@link SetCommunityPostPinnedRequest} + user.
     * @returns The updated post node.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<SetCommunityPostPinnedRequest>): Promise<CommunityPostNodeObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // pin/unpin via the domain service (founder gate + event fan-out inside)
        const post = await this.communityPostService.setPinned({
            postId: request.postId,
            pinned: request.pinned,
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
