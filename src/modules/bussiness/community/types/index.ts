import type {
    CommunityChannel,
    CommunityPostCommentEntity,
    CommunityPostEntity,
    ReactionType,
    UserEntity,
} from "@modules/databases"

/** Params to create a community post. */
export interface CreateCommunityPostParams {
    /** The authoring user. */
    user: UserEntity
    /** Channel the post is published to. */
    channel: CommunityChannel
    /** Raw markdown/plain body authored by the user. */
    body: string
}

/** Params to update a community post's body. */
export interface UpdateCommunityPostParams {
    /** Post to edit. */
    postId: string
    /** New body. */
    body: string
    /** The user performing the edit (must be the author). */
    user: UserEntity
}

/** Params to pin/unpin a community post (founder-only). */
export interface SetCommunityPostPinnedParams {
    /** Post to pin or unpin. */
    postId: string
    /** Target pinned state. */
    pinned: boolean
    /** The user performing the action (must be the founder). */
    user: UserEntity
}

/** Params to soft-delete a community post. */
export interface DeleteCommunityPostParams {
    /** Post to soft-delete. */
    postId: string
    /** The user performing the delete (must be the author). */
    user: UserEntity
}

/** Result of a community post soft-delete. */
export interface DeleteCommunityPostResult {
    /** Id of the soft-deleted post. */
    id: string
}

/** Params to list a page of the community feed. */
export interface ListCommunityFeedParams {
    /** Channel to scope to; null/undefined lists across all channels. */
    channel?: CommunityChannel | null
    /** Rows to skip (offset pagination). */
    offset: number
    /** Max rows to return. */
    limit: number
}

/** Result of a community feed listing. */
export interface ListCommunityFeedResult {
    /** The page of posts (author relation loaded), pinned-first then newest. */
    posts: Array<CommunityPostEntity>
    /** Total posts matching the scope (for pagination). */
    total: number
}

/** Params to create a community post comment (top-level or reply). */
export interface CreateCommunityCommentParams {
    /** Post the comment is attached to. */
    postId: string
    /** Parent comment id when replying; null/omitted for a top-level comment. */
    parentCommentId?: string | null
    /** Raw comment body authored by the user. */
    body: string
    /** The authoring user. */
    user: UserEntity
}

/** Params to update a community post comment's body. */
export interface UpdateCommunityCommentParams {
    /** Comment to edit. */
    commentId: string
    /** New body. */
    body: string
    /** The user performing the edit (must be the author). */
    user: UserEntity
}

/** Params to soft-delete a community post comment. */
export interface DeleteCommunityCommentParams {
    /** Comment to soft-delete. */
    commentId: string
    /** The user performing the delete (must be the author). */
    user: UserEntity
}

/** Result of a community post comment soft-delete. */
export interface DeleteCommunityCommentResult {
    /** Id of the soft-deleted comment. */
    id: string
}

/**
 * Params to list a page of a community post's comments. The listing does NOT
 * filter out soft-deleted comments (unlike `listFeed` on posts) — a
 * soft-deleted comment still appears in the page so the FE can render its
 * placeholder in place rather than shifting the thread.
 */
export interface ListCommunityCommentsParams {
    /** Post whose comments are listed. */
    postId: string
    /** Parent comment id to list its replies; omit/undefined for top-level comments. */
    parentCommentId?: string | null
    /** 1-based page number. */
    page?: number
    /** Page size. */
    limit?: number
}

/**
 * Result of a community post comments listing. `comments` INCLUDES
 * soft-deleted rows (`isDeleted: true`) — the caller must check the flag
 * itself to render a placeholder instead of the live body.
 */
export interface ListCommunityCommentsResult {
    /** The page of comment rows (author relation loaded); may include soft-deleted rows. */
    comments: Array<CommunityPostCommentEntity>
    /** Total comments matching the scope (for pagination). */
    total: number
}

/** Raw grouped row counting direct replies per parent comment id. */
export interface CommunityReplyCountRow {
    /** Parent comment id the count is grouped by (raw column `parentId`). */
    parentId: string
    /** Number of direct replies (Postgres COUNT returns text). */
    count: string
}

/** Raw grouped row counting comments per post id. */
export interface CommunityPostCommentCountRow {
    /** Post id the count is grouped by (raw column `postId`). */
    postId: string
    /** Number of comments on the post (Postgres COUNT returns text). */
    count: string
}

/** Params to set/change/remove a reaction on a community post. */
export interface ReactToCommunityPostParams {
    /** Post being reacted to. */
    postId: string
    /** The reacting user. */
    user: UserEntity
    /** The emotion to set, or null to remove the reaction. */
    type: ReactionType | null
}

/** Params to set/change/remove a reaction on a community post comment. */
export interface ReactToCommunityCommentParams {
    /** Comment being reacted to. */
    commentId: string
    /** The reacting user. */
    user: UserEntity
    /** The emotion to set, or null to remove the reaction. */
    type: ReactionType | null
}

/** Params to batch-summarize reactions for many community posts. */
export interface SummarizeCommunityPostsParams {
    /** Post ids to summarize. */
    postIds: Array<string>
    /** The viewing user id (for `myReaction`). */
    userId: string
}

/** Params to batch-summarize reactions for many community post comments. */
export interface SummarizeCommunityCommentsParams {
    /** Comment ids to summarize. */
    commentIds: Array<string>
    /** The viewing user id (for `myReaction`). */
    userId: string
}

/** Raw grouped row counting reactions per (post, emotion). */
export interface CommunityPostReactionCountRow {
    /** Post id the count is grouped by (raw column `postId`). */
    postId: string
    /** Emotion kind the count is grouped by. */
    type: ReactionType
    /** Number of reactions of this emotion (Postgres COUNT returns text). */
    count: string
}

/** Raw row carrying one user's reaction on a post. */
export interface CommunityPostReactionRow {
    /** Post id the reaction belongs to (raw column `postId`). */
    postId: string
    /** The emotion the user picked. */
    type: ReactionType
}

/** Raw grouped row counting reactions per (comment, emotion). */
export interface CommunityCommentReactionCountRow {
    /** Comment id the count is grouped by (raw column `commentId`). */
    commentId: string
    /** Emotion kind the count is grouped by. */
    type: ReactionType
    /** Number of reactions of this emotion (Postgres COUNT returns text). */
    count: string
}

/** Raw row carrying one user's reaction on a comment. */
export interface CommunityCommentReactionRow {
    /** Comment id the reaction belongs to (raw column `commentId`). */
    commentId: string
    /** The emotion the user picked. */
    type: ReactionType
}

/** Params to assert a user is allowed to create another community post. */
export interface AssertCanCreateCommunityPostParams {
    /** The user attempting to create a post. */
    userId: string
}

/** Params to fan out reply notifications when a community comment is created. */
export interface NotifyCommunityReplyTargetsParams {
    /** Post the new comment belongs to (notification target). */
    postId: string
    /** Author id of the post (a notification recipient unless it is the actor). */
    postAuthorId: string
    /** Author id of the parent comment on a reply; null for a top-level comment. */
    parentAuthorId: string | null
    /** The user who created the comment (never notified about their own act). */
    actor: UserEntity
}
