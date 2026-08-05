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
    CommunityPostRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Query service for a single community post. Loads the post (404 if missing) and
 * assembles its reaction summary + comment count into a client-facing node. Open
 * to everyone (optional auth); `myReaction`/`isMine` only set when authenticated.
 */
export class CommunityPostQueryService {
    constructor(
        private readonly communityPostService: CommunityPostService,
        private readonly communityReactionService: CommunityReactionService,
        private readonly communityCommentService: CommunityCommentService,
    ) {}

    /**
     * Fetches a single community post node.
     * @param params - Execute params carrying the {@link CommunityPostRequest} + optional user.
     * @returns The post node.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<CommunityPostRequest>): Promise<CommunityPostNodeObject> {
        // load the post (with author) or throw a typed not-found
        const post = await this.communityPostService.getPostOrThrow(request.postId)
        // reaction summary for this single post from the viewer's perspective
        const reactionSummaries = await this.communityReactionService.summarizePosts({
            postIds: [
                post.id,
            ],
            userId: user?.id ?? "",
        })
        // comment count for the "N comments" affordance
        const commentCounts = await this.communityCommentService.countCommentsByPosts([
            post.id,
        ])
        // assemble the client-facing node, defaulting aggregates defensively
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
            viewerId: user?.id ?? null,
        })
    }
}
