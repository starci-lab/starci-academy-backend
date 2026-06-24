import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    Octokit,
} from "octokit"
import type {
    AddGithubUserToTeamInOrgParams,
    AddGithubUserToTeamInOrgResult,
    GetGithubUserTeamMembershipParams,
    GetGithubUserTeamMembershipResult,
    RemoveGithubUserFromTeamInOrgParams,
    RemoveGithubUserFromTeamInOrgResult,
} from "./types"

/**
 * GitHub organization API service (team membership operations).
 */
@Injectable()
export class GithubApiOrgService {
    constructor(
        private readonly mountStorageService: MountStorageService,
    ) {}

    /**
     * Adds or updates a user's membership in an organization team.
     *
     * @param param - Team slug, username, and optional role
     * @returns Membership state and role from GitHub response
     */
    async addUserToTeamInOrg(
        {
            teamSlug,
            githubUsername,
            role = "member",
        }: AddGithubUserToTeamInOrgParams,
    ): Promise<AddGithubUserToTeamInOrgResult> {
        const octokit = new Octokit(
            {
                auth: this.mountStorageService.githubAccessToken,
            },
        )
        const response = await octokit.rest.teams.addOrUpdateMembershipForUserInOrg(
            {
                org: envConfig().services.github.organization,
                team_slug: teamSlug,
                username: githubUsername,
                role,
            },
        )

        return {
            state: response.data.state,
            role: response.data.role,
        }
    }

    /**
     * Removes a user from an organization team (revokes course repo access).
     *
     * Idempotent from the caller's perspective: GitHub returns 204 whether the
     * user was a member or not, so re-running a revoke job is safe.
     *
     * @param param - Team slug and username
     * @returns Whether the removal call completed without error
     */
    async removeUserFromTeamInOrg(
        {
            teamSlug,
            githubUsername,
        }: RemoveGithubUserFromTeamInOrgParams,
    ): Promise<RemoveGithubUserFromTeamInOrgResult> {
        const octokit = new Octokit(
            {
                auth: this.mountStorageService.githubAccessToken,
            },
        )
        await octokit.rest.teams.removeMembershipForUserInOrg(
            {
                org: envConfig().services.github.organization,
                team_slug: teamSlug,
                username: githubUsername,
            },
        )

        return {
            success: true,
        }
    }

    /**
     * Read a user's membership state in an org team. `active` = accepted member,
     * `pending` = invited but not yet accepted, `none` = neither (GitHub 404).
     * Used to gate the "request to team" flow — linking a GitHub identity and
     * actually being in the team are separate states.
     *
     * @param param - Team slug and username.
     * @returns The membership state.
     */
    async getUserTeamMembership(
        {
            teamSlug,
            githubUsername,
        }: GetGithubUserTeamMembershipParams,
    ): Promise<GetGithubUserTeamMembershipResult> {
        const octokit = new Octokit(
            {
                auth: this.mountStorageService.githubAccessToken,
            },
        )
        try {
            const response = await octokit.rest.teams.getMembershipForUserInOrg(
                {
                    org: envConfig().services.github.organization,
                    team_slug: teamSlug,
                    username: githubUsername,
                },
            )
            return {
                state: response.data.state === "active" ? "active" : "pending",
            }
        } catch (error) {
            // 404 → user is neither a member nor has a pending invite
            if ((error as { status?: number }).status === 404) {
                return {
                    state: "none",
                }
            }
            throw error
        }
    }

}