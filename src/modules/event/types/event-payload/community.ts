import type {
    CommunityChannel,
} from "@modules/databases"

/**
 * Payload emitted when a community post is created/updated/soft-deleted.
 *
 * Kept minimal on purpose: clients use it only to decide whether the change is in
 * a channel they are viewing, then refetch the feed (refetch-on-event model).
 */
export interface CommunityPostChangedEventPayload {
    /** The post that changed. */
    postId: string
    /** Channel the post belongs to (used to target the per-channel socket room). */
    channel: CommunityChannel
}

/**
 * Payload emitted when a comment on a community post is created/updated/soft-deleted.
 *
 * Clients use it to decide whether the change is for the post they are viewing,
 * then refetch the affected comment list.
 */
export interface CommunityCommentChangedEventPayload {
    /** Post the comment belongs to (used to target the socket room + client filter). */
    postId: string
    /** The comment that changed. */
    commentId: string
    /** Parent comment id when the changed comment is a reply; null for a top-level comment. */
    parentCommentId: string | null
}

/**
 * Payload emitted when the aggregate reactions on a community post change.
 */
export interface CommunityPostReactionChangedEventPayload {
    /** Post whose reaction summary changed. */
    postId: string
}

/**
 * Payload emitted when the aggregate reactions on a community post comment change.
 */
export interface CommunityCommentReactionChangedEventPayload {
    /** Post the comment belongs to (used to target the socket room). */
    postId: string
    /** Comment whose reaction summary changed. */
    commentId: string
}
