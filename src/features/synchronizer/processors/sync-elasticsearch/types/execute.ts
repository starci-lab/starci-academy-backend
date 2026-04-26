/** Result of the sync-elasticsearch-entity step. */
export interface SyncElasticsearchEntityStepContextExecutionResult {
    /** Last entity id processed. */
    resumeAfterEntityId: string
}