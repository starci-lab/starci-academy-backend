import type {
    CommunityChannel,
} from "@modules/databases/postgresql/primary/enums/community-channel"

/** Server -> client message when a community post is created/updated/deleted. */
export interface CommunityPostChangedSocketIoMessage {
    /** The post that changed. */
    postId: string
    /** Channel the post belongs to. */
    channel: CommunityChannel
}

/** Server -> client message when a community post comment is created/updated/deleted. */
export interface CommunityCommentChangedSocketIoMessage {
    /** Post the comment belongs to. */
    postId: string
    /** The comment that changed. */
    commentId: string
    /** Parent comment id when the changed comment is a reply; null for top-level. */
    parentCommentId: string | null
}

/** Server -> client message when a community post's aggregate reactions change. */
export interface CommunityPostReactionChangedSocketIoMessage {
    /** Post whose reaction summary changed. */
    postId: string
}

/** Server -> client message when a community post comment's aggregate reactions change. */
export interface CommunityCommentReactionChangedSocketIoMessage {
    /** Post the comment belongs to. */
    postId: string
    /** Comment whose reaction summary changed. */
    commentId: string
}
