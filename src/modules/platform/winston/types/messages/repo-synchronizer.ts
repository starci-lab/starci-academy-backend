/** Message for when repo synchronizer starts a sync cycle. */
export interface RepoSynchronizerSyncStartedMessage {
    startedAt: unknown
}

/** Message for when repo synchronizer finishes syncing a sandbox content's files. */
export interface RepoSynchronizerContentSyncedMessage {
    contentId: string
    contentDisplayId: string
    key: string
    fileCount: number
}

/** Message for when repo synchronizer fails to sync a sandbox content. */
export interface RepoSynchronizerContentSyncFailedMessage {
    contentId: string
    contentDisplayId: string
    errorMessage: string
}

/** Message for when repo synchronizer completes a sync cycle. */
export interface RepoSynchronizerSyncDoneMessage {
    doneAt: unknown
    durationMs: number
}
