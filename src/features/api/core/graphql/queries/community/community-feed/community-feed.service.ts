import {
    Injectable,
} from "@nestjs/common"
import {
    CommunityCommentService,
    CommunityPostService,
    CommunityReactionService,
} from "@modules/bussiness"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CommunityFeedPageObject,
    mapCommunityPostNode,
} from "../../../shared/community"
import type {
    CommunityFeedRequest,
} from "./graphql-types"
import type {
    DecodedCommunityFeedCursor,
} from "./types"

/** Hard cap on page size to bound the query regardless of client input. */
const MAX_LIMIT = 50

/** Default page size when the client omits `limit`. */
const DEFAULT_LIMIT = 20

/**
 * Query service for the community feed. Loads a page of posts (pinned-first, then
 * newest), then batch-resolves reaction summaries + comment counts so the client
 * gets ready-to-render nodes. Open to everyone (optional auth): the viewer's own
 * reaction + `isMine` are only populated when authenticated.
 */
@Injectable()
export class CommunityFeedService {
    constructor(
        private readonly communityPostService: CommunityPostService,
        private readonly communityReactionService: CommunityReactionService,
        private readonly communityCommentService: CommunityCommentService,
    ) {}

    /**
     * Lists a page of the community feed and assembles client-facing nodes.
     * @param params - Execute params carrying the {@link CommunityFeedRequest} + optional user.
     * @returns A page of post nodes + the next cursor.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<CommunityFeedRequest>): Promise<CommunityFeedPageObject> {
        // clamp page size into a sane bound regardless of what the client asked for
        const limit = Math.min(Math.max(request.limit ?? DEFAULT_LIMIT,
            1),
        MAX_LIMIT)
        // decode the opaque cursor → offset; absent/bad cursor means page 1 (offset 0)
        const offset = this.decodeCursor(request.cursor)?.offset ?? 0
        // pull the page of posts + the total so we can tell whether more remain
        const {
            posts,
            total,
        } = await this.communityPostService.listFeed({
            channel: request.channel ?? null,
            offset,
            limit,
        })
        // collect ids once to batch the two follow-up aggregate queries
        const postIds = posts.map((post) => post.id)
        // reaction summaries per post from this viewer's perspective (empty viewer = no myReaction)
        const reactionSummaries = await this.communityReactionService.summarizePosts({
            postIds,
            userId: user?.id ?? "",
        })
        // comment counts per post for the "N comments" affordance
        const commentCounts = await this.communityCommentService.countCommentsByPosts(postIds)
        // map each row into a node, defaulting missing aggregates defensively
        const items = posts.map((post) => mapCommunityPostNode({
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
        }))
        // there is a next page iff we have not yet walked past the total
        const hasMore = offset + posts.length < total
        const nextCursor = hasMore
            ? this.encodeCursor(offset + limit)
            : null
        return {
            items,
            nextCursor,
        }
    }

    /**
     * Encode the next `offset` into an opaque base64url token the client passes
     * back verbatim to fetch the following page.
     * @param offset - rows to skip on the next page
     * @returns the opaque cursor string
     */
    private encodeCursor(offset: number): string {
        // base64url-encoded JSON keeps the cursor opaque to the client
        return Buffer.from(JSON.stringify({
            offset,
        }),
        "utf8").toString("base64url")
    }

    /**
     * Decode an opaque cursor back to `{ offset }`. Returns null when absent or
     * malformed (treated as page 1 → offset 0).
     * @param cursor - the opaque cursor, or undefined
     * @returns the decoded cursor, or null
     */
    private decodeCursor(cursor?: string): DecodedCommunityFeedCursor | null {
        // no cursor → page 1
        if (!cursor) {
            return null
        }
        // base64url → JSON; bail to page 1 on any bad/partial token
        try {
            const raw = Buffer.from(cursor,
                "base64url").toString("utf8")
            const parsed = JSON.parse(raw) as Partial<DecodedCommunityFeedCursor>
            // reject anything that is not a finite, non-negative offset
            if (typeof parsed.offset !== "number"
                || !Number.isFinite(parsed.offset)
                || parsed.offset < 0) {
                return null
            }
            return {
                offset: Math.floor(parsed.offset),
            }
        } catch {
            return null
        }
    }
}
