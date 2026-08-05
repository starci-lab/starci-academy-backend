/** Server -> client message when a comment is created/updated/deleted. */
export interface CommentChangedSocketIoMessage {
    /** Content the comment belongs to. */
    contentId: string
    /** The comment that changed. */
    commentId: string
    /** Parent comment id when the changed comment is a reply; null for top-level. */
    parentCommentId: string | null
}

/** Server -> client message when a content's aggregate reactions change. */
export interface ContentReactionChangedSocketIoMessage {
    /** Content whose reaction summary changed. */
    contentId: string
}

/** Server -> client message when a comment's aggregate reactions change. */
export interface CommentReactionChangedSocketIoMessage {
    /** Content the comment belongs to. */
    contentId: string
    /** Comment whose reaction summary changed. */
    commentId: string
}
