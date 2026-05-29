/**
 * Role a user holds within a GitHub team.
 * - `"member"`: regular team member.
 * - `"maintainer"`: can manage team membership and settings.
 */
export type GithubTeamRole = "member" | "maintainer"
/**
 * Params for adding or updating a GitHub team membership in an organization.
 */
export interface AddGithubUserToTeamInOrgParams {
    /**
     * The slug of the team to add the user to.
     */
    teamSlug: string
    /**
     * The username of the user to add to the team.
     */
    githubUsername: string
    /**
     * The role of the user in the team.
     */
    role?: GithubTeamRole
}

/**
 * Result of adding or updating a GitHub team membership.
 */
export interface AddGithubUserToTeamInOrgResult {
    /** Membership state returned by GitHub (e.g. "active" or "pending"). */
    state: string
    /** The resulting role of the user in the team (e.g. "member" or "maintainer"). */
    role: string
}

