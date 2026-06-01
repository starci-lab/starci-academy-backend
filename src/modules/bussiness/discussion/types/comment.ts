import type {
    ContentCommentEntity,
    UserEntity,
} from "@modules/databases"

/** Params to create a comment (top-level or reply) on a content. */
export interface CreateCommentParams {
    /** Content the comment is attached to. */
    contentId: string
    /** Parent comment id when replying; null/omitted for a top-level comment. */
    parentCommentId?: string | null
    /** Raw comment body authored by the user. */
    body: string
    /** Authenticated author. */
    user: UserEntity
}

/** Params to edit an existing comment (author only). */
export interface UpdateCommentParams {
    /** Comment being edited. */
    commentId: string
    /** New body to persist. */
    body: string
    /** Authenticated user performing the edit (must be the author). */
    user: UserEntity
}

/** Params to soft-delete a comment (author only). */
export interface DeleteCommentParams {
    /** Comment being deleted. */
    commentId: string
    /** Authenticated user performing the delete (must be the author). */
    user: UserEntity
}

/** Result of a soft-delete. */
export interface DeleteCommentResult {
    /** Id of the deleted comment. */
    id: string
}

/** Params to list comments for a content, optionally scoped to one parent (replies). */
export interface ListCommentsParams {
    /** Content whose comments are listed. */
    contentId: string
    /** When set, list replies of this comment; when null/omitted, list top-level comments. */
    parentCommentId?: string | null
    /** 1-based page number (default 1). */
    page?: number
    /** Page size (default 20). */
    limit?: number
}

/** Result of a comment list query. */
export interface ListCommentsResult {
    /** The page of comment rows (author relation loaded). */
    comments: Array<ContentCommentEntity>
    /** Total comments matching the scope (for pagination). */
    total: number
}
