/** Result of the sync-batch-emails step (cursor between batches). */
export interface SyncEmailBloomFilterStepContextExecuteResult {
    /** Last user id processed in the previous batch. */
    resumeAfterUserId?: string | null
}

/** Result of the sync-email-bloom-filter step. */
export interface ProcessEmailBloomFilterStepExecuteResult {
    /** Whether the email bloom filter is ready. */
    isEmailBloomFilterReady: boolean
}