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
