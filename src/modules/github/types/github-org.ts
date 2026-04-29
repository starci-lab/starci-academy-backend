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
    state: string
    role: string
}

