import type {
    ContentCommentEntity,
} from "@modules/databases"
import type {
    ReactionSummaryResult,
} from "@modules/bussiness"
import type {
    CommentNodeObject,
} from "../object-types"

/** Placeholder body shown to clients in place of a soft-deleted comment's text. */
export const DELETED_COMMENT_PLACEHOLDER = ""

/** Params to map a comment entity into a client-facing node. */
export interface MapCommentNodeParams {
    /** The comment entity (with `user` author relation loaded). */
    comment: ContentCommentEntity
    /** Direct reply count for this comment. */
    replyCount: number
    /** Reaction summary for this comment from the viewer's view. */
    reactions: ReactionSummaryResult
}

/**
 * Maps a comment entity + computed counts into a {@link CommentNodeObject}. Soft-deleted
 * comments expose an empty body so the client renders its own localized "[deleted]" label
 * while keeping the row in the thread.
 * @param params - {@link MapCommentNodeParams}
 * @returns The client-facing comment node.
 */
export const mapCommentNode = ({
    comment,
    replyCount,
    reactions,
}: MapCommentNodeParams): CommentNodeObject => ({
    // identity + content straight from the row
    id: comment.id,
    // hide the real body when soft-deleted; the client shows a localized placeholder
    body: comment.isDeleted ? DELETED_COMMENT_PLACEHOLDER : comment.body,
    isDeleted: comment.isDeleted,
    editedAt: comment.editedAt,
    createdAt: comment.createdAt,
    parentCommentId: comment.parentCommentId,
    // author relation must be loaded by the caller
    author: comment.user,
    // computed aggregates passed in by the resolver
    replyCount,
    reactions,
})
