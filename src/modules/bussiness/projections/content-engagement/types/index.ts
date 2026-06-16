import type {
    EntityManager,
} from "typeorm"
import type {
    ReactionType,
} from "@modules/databases"

/**
 * Params for recomputing one content's engagement projection row.
 */
export interface RecomputeContentEngagementParams {
    /** The content whose engagement counters to rebuild. */
    contentId: string
    /**
     * Caller's transaction manager — pass it from an inline write so the
     * projection commits atomically with the source change; omit for the CDC path.
     */
    entityManager?: EntityManager
}

/**
 * Flat engagement counters for a content — the typed view parsed out of the
 * projection's jsonb `value`. The per-viewer `myReaction` is resolved separately
 * (it depends on who is asking).
 */
export interface ContentEngagementSummary {
    /** Total reactions across every emotion. */
    totalReactions: number
    /** Per-emotion counts, e.g. `{ like: 12, love: 3 }` (zero buckets omitted). */
    reactionsByType: Record<ReactionType, number>
    /** Distinct readers (the "view" count). */
    viewCount: number
    /** Shares (0 until sharing is implemented). */
    shareCount: number
    /** Top-level + reply comments on the content. */
    commentCount: number
}

/** CDC row shape carrying a content id (reactions / comments / user-contents). */
export interface ContentScopedCdcRow {
    /** Source `content_id` column (the recompute key). */
    content_id?: string
}
