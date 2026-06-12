/** Message for when a reconcile target's prune was skipped by the ratio guard. */
export interface ReconcileOrphansSkippedMessage {
    /** Sink the skip applies to (`elasticsearch` | `cdn`). */
    sink: string
    /** Target identifier (e.g. `ContentEntity-vi` or `courses/`). */
    target: string
    /** Total entries present in the sink for this target. */
    total: number
    /** Number of entries that would have been deleted. */
    orphans: number
    /** The configured max delete ratio that was exceeded. */
    maxRatio: number
}

/** Message for when the orphan reconcile pass completes for a boot. */
export interface ReconcileOrphansDoneMessage {
    /** Total Elasticsearch docs deleted across all targets. */
    elasticsearchDeleted: number
    /** Total CDN objects deleted across all targets. */
    cdnDeleted: number
}
