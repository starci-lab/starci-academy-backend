/** Result of one build-parent-index step. */
export interface SyncIndexerStepContextExecuteResult {
    /** Last id processed; used for resuming within a long scan. */
    resumeAfterId?: string
}

