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

/**
 * Params for removing a user from a GitHub team in an organization.
 */
export interface RemoveGithubUserFromTeamInOrgParams {
    /**
     * The slug of the team to remove the user from.
     */
    teamSlug: string
    /**
     * The username of the user to remove from the team.
     */
    githubUsername: string
}

/**
 * Result of removing a user from a GitHub team.
 */
export interface RemoveGithubUserFromTeamInOrgResult {
    /** Whether the removal call completed without error. */
    success: boolean
}

/**
 * Membership of a user in a GitHub org team:
 * - `active`  -- accepted member (in the team).
 * - `pending` -- invited, not yet accepted.
 * - `none`    -- neither member nor invited.
 */
export type GithubTeamMembershipState = "active" | "pending" | "none"

/**
 * Params for reading a user's GitHub team membership state.
 */
export interface GetGithubUserTeamMembershipParams {
    /** The slug of the team to check. */
    teamSlug: string
    /** The GitHub username to check. */
    githubUsername: string
}

/**
 * Result of a team-membership lookup.
 */
export interface GetGithubUserTeamMembershipResult {
    /** Membership state from GitHub (404 -> `none`). */
    state: GithubTeamMembershipState
}


