import type {
    ReactionType,
    UserEntity,
} from "@modules/databases"

/** A single emotion bucket with its count. */
export interface ReactionCountResult {
    /** The emotion kind. */
    type: ReactionType
    /** How many users picked this emotion. */
    count: number
}

/**
 * One per-emotion count row fed into summary folding. `count` is `string |
 * number` because raw Postgres `COUNT(*)` arrives as a numeric string while
 * already-aggregated callers pass a number; folding normalizes both.
 */
export interface ReactionCountInputRow {
    /** The emotion kind for this bucket. */
    type: ReactionType
    /** Number of reactions of this emotion, as a numeric string or number. */
    count: string | number
}

/** Aggregate reaction state for a target (content or comment), from one user's view. */
export interface ReactionSummaryResult {
    /** Per-emotion counts (only emotions with at least one reaction). */
    counts: Array<ReactionCountResult>
    /** Total reactions across all emotions. */
    total: number
    /** The viewing user's own reaction, or null if they have not reacted. */
    myReaction: ReactionType | null
    /**
     * Number of distinct users who have read this content.
     * Only set for content-level summaries; comment summaries default to 0.
     */
    viewCount: number
    /**
     * Number of times this content has been shared.
     * Reserved — always 0 until share tracking is implemented.
     */
    shareCount: number
}

/**
 * One raw grouped-count row from the per-comment reaction aggregate
 * (`SELECT comment_id AS commentId, type, COUNT(*) AS count`). `count` is a
 * string because Postgres returns `COUNT(*)` as `bigint` text over the wire.
 */
export interface CommentReactionCountRow {
    /** The comment the reactions belong to. */
    commentId: string
    /** The emotion kind for this bucket. */
    type: ReactionType
    /** Number of reactions of this emotion, as a numeric string. */
    count: string
}

/**
 * One raw row from the viewer's own-reaction query
 * (`SELECT comment_id AS commentId, type`), used to highlight the viewer's
 * current reaction per comment.
 */
export interface CommentReactionRow {
    /** The comment the viewer reacted on. */
    commentId: string
    /** The emotion the viewer picked. */
    type: ReactionType
}

/** Params to set/change/remove the current user's reaction on a content. */
export interface ReactToContentParams {
    /** Content being reacted to. */
    contentId: string
    /** Authenticated user reacting. */
    user: UserEntity
    /** New emotion, or null to remove the existing reaction. */
    type: ReactionType | null
}

/** Params to set/change/remove the current user's reaction on a comment. */
export interface ReactToCommentParams {
    /** Comment being reacted to. */
    commentId: string
    /** Authenticated user reacting. */
    user: UserEntity
    /** New emotion, or null to remove the existing reaction. */
    type: ReactionType | null
}

/** Params to summarize one content's reactions from a user's view. */
export interface SummarizeContentReactionsParams {
    /** Content to summarize. */
    contentId: string
    /** Viewing user id (for `myReaction`). */
    userId: string
}

/** Params to batch-summarize several comments' reactions from a user's view. */
export interface SummarizeCommentReactionsParams {
    /** Comment ids to summarize. */
    commentIds: Array<string>
    /** Viewing user id (for `myReaction`). */
    userId: string
}
