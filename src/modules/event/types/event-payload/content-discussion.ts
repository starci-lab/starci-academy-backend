/**
 * Payload emitted when a comment on a content is created/updated/soft-deleted.
 *
 * Kept minimal on purpose: clients use it only to decide whether the change is for the
 * content they are viewing, then refetch the affected list (refetch-on-event model).
 */
export interface CommentChangedEventPayload {
    /** Content the comment belongs to (used to target the socket room + client filter). */
    contentId: string
    /** The comment that changed. */
    commentId: string
    /** Parent comment id when the changed comment is a reply; null for a top-level comment. */
    parentCommentId: string | null
}

/**
 * Payload emitted when the aggregate reactions on a content change.
 */
export interface ContentReactionChangedEventPayload {
    /** Content whose reaction summary changed. */
    contentId: string
}

/**
 * Payload emitted when the aggregate reactions on a comment change.
 */
export interface CommentReactionChangedEventPayload {
    /** Content the comment belongs to (used to target the socket room). */
    contentId: string
    /** Comment whose reaction summary changed. */
    commentId: string
}
