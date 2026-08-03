/**
 * Payload for a revoke-github job (removes a user from an organization team).
 */
export interface EnqueueRevokeGithubPayload {
    /** User ID whose GitHub team membership is being revoked. */
    userId: string

    /** GitHub username to remove from the organization/team. */
    githubUsername: string

    /** GitHub team slug resolved from the course slug. */
    teamSlug: string
}
