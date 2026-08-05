import {
    envConfig,
} from "@modules/platform/env/config"
import type {
    CommunityPostCommentEntity,
} from "@modules/databases/postgresql/primary/entities/community-post-comment.entity"
import type {
    ReactionSummaryResult,
} from "@modules/bussiness/discussion/types/reaction"
import type {
    CommunityCommentNodeObject,
} from "../object-types/community-comment-node.object"

/** Placeholder body shown to clients in place of a soft-deleted comment's text. */
export const DELETED_COMMUNITY_COMMENT_PLACEHOLDER = ""

/** Params to map a community post comment entity into a client-facing node. */
export interface MapCommunityCommentNodeParams {
    /** The comment entity (with `user` author relation loaded). */
    comment: CommunityPostCommentEntity
    /** Direct reply count for this comment. */
    replyCount: number
    /** Reaction summary for this comment from the viewer's view. */
    reactions: ReactionSummaryResult
}

/**
 * Maps a community post comment entity + computed counts into a
 * {@link CommunityCommentNodeObject}. Soft-deleted comments expose an empty body so
 * the client renders its own localized "[deleted]" label while keeping the row.
 * @param params - {@link MapCommunityCommentNodeParams}
 * @returns The client-facing comment node.
 */
export const mapCommunityCommentNode = ({
    comment,
    replyCount,
    reactions,
}: MapCommunityCommentNodeParams): CommunityCommentNodeObject => ({
    // identity + content straight from the row
    id: comment.id,
    // hide the real body when soft-deleted; the client shows a localized placeholder
    body: comment.isDeleted ? DELETED_COMMUNITY_COMMENT_PLACEHOLDER : comment.body,
    isDeleted: comment.isDeleted,
    editedAt: comment.editedAt,
    createdAt: comment.createdAt,
    parentCommentId: comment.parentCommentId,
    // author relation must be loaded by the caller
    author: comment.user,
    // computed aggregates passed in by the resolver
    replyCount,
    reactions,
    // founder badge: the author's username matches the configured founder handle
    isFounderAuthor: comment.user.username === envConfig().community.founderUsername,
})
