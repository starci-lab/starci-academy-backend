/**
 * Payload for GitHub team invitation job.
 */
export interface InviteGithubPayload {
    /**
     * User ID to invite to GitHub organization.
     */
    userId: string

    /**
     * GitHub username to add to the organization/team.
     */
    githubUsername: string

    /**
     * GitHub team slug resolved from the course slug.
     */
    teamSlug: string
}
