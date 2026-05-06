/** Message for when sync orchestrator starts. */
export interface SyncOrchestratorStartedMessage {
    startedAt: unknown
}

/** Message for when sync orchestrator completes. */
export interface SyncOrchestratorDoneMessage {
    doneAt: unknown
    durationMs: number
}
