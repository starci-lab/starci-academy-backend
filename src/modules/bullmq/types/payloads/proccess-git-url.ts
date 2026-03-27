export interface ProccessGitUrlPayload {
    /** The ID of the tracked job record. */
    jobId: string
    /** Public git repository URL to process. */
    githubUrl: string
    /** Branch to load (default is configured in env). */
    branch?: string
    /** Optional collection name override for Qdrant. */
    collectionName?: string
}
