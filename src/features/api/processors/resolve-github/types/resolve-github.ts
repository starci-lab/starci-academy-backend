/**
 * Params for enqueueing a resolve-github invite job.
 */
export interface EnqueueResolveGithubParams {
    userId: string
    githubUsername: string
    teamSlug: string
}

/**
 * Result of enqueueing a resolve-github invite job.
 */
export interface EnqueueResolveGithubResult {
}

