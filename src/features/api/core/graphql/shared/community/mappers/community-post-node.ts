import {
    envConfig,
} from "@modules/env"
import type {
    CommunityPostEntity,
} from "@modules/databases"
import type {
    ReactionSummaryResult,
} from "@modules/bussiness"
import type {
    CommunityPostNodeObject,
} from "../object-types"

/** Placeholder body shown to clients in place of a soft-deleted post's text. */
export const DELETED_COMMUNITY_POST_PLACEHOLDER = ""

/** Params to map a community post entity into a client-facing node. */
export interface MapCommunityPostNodeParams {
    /** The post entity (with `author` relation loaded). */
    post: CommunityPostEntity
    /** Reaction summary for this post from the viewer's view. */
    reactions: ReactionSummaryResult
    /** Number of comments on this post. */
    commentCount: number
    /** The viewing user's id, or null when unauthenticated. */
    viewerId: string | null
}

/**
 * Maps a community post entity + computed counts into a {@link CommunityPostNodeObject}.
 * Soft-deleted posts expose an empty body so the client renders its own localized
 * "[deleted]" label while keeping the row in the feed.
 * @param params - {@link MapCommunityPostNodeParams}
 * @returns The client-facing post node.
 */
export const mapCommunityPostNode = ({
    post,
    reactions,
    commentCount,
    viewerId,
}: MapCommunityPostNodeParams): CommunityPostNodeObject => ({
    // identity + content straight from the row
    id: post.id,
    // hide the real body when soft-deleted; the client shows a localized placeholder
    body: post.isDeleted ? DELETED_COMMUNITY_POST_PLACEHOLDER : post.body,
    channel: post.channel,
    isPinned: post.isPinned,
    isDeleted: post.isDeleted,
    editedAt: post.editedAt,
    createdAt: post.createdAt,
    // author relation must be loaded by the caller
    author: post.author,
    // computed aggregates passed in by the resolver
    commentCount,
    reactions,
    // only true for the authenticated author of this post
    isMine: viewerId ? post.authorId === viewerId : false,
    // founder badge: the author's username matches the configured founder handle
    isFounderAuthor: post.author.username === envConfig().community.founderUsername,
})
