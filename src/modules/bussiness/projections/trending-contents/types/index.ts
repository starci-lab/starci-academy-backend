import type {
    EntityManager,
} from "typeorm"

/** Params for recomputing the global trending row. */
export interface RecomputeTrendingParams {
    /** Caller's transaction manager (inline write path); omit for the read path. */
    entityManager?: EntityManager
}

/** Params for reading the trending board for one viewer. */
export interface GetTrendingParams {
    /** Max lessons to return after excluding the viewer's own reads. */
    limit: number
    /** Viewer whose already-read lessons are excluded so "trending" reflects the crowd. */
    viewerId: string
}

/** One trending candidate stored in the projection's jsonb `value.items`. */
export interface TrendingItemValue {
    /** Content id. */
    id: string
    /** Lesson title (snapshotted for display). */
    title: string
    /** Times read in the rolling 7-day window. */
    readCount: number
}

/** One trending lesson returned by {@link TrendingContentsProjectionService.getTrending}. */
export interface TrendingItemResult {
    /** Content id (mapped to a route token by the resolver). */
    id: string
    /** Lesson title. */
    title: string
    /** Recent read count. */
    readCount: number
}

/** Raw row from the per-viewer membership check over the bounded candidate set. */
export interface ContentIdRow {
    /** A candidate content the viewer has already read. */
    content_id: string
}

/** Raw row from the rolling 7-day GROUP BY in recompute. */
export interface TrendingAggregateRow {
    /** Content id. */
    id: string
    /** Lesson title. */
    title: string
    /** Read count in the window. */
    read_count: number
}
