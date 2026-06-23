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
    GrantTeamRepoAccessParams,
    GrantTeamRepoAccessResult,
    ListOrgRepoNamesByPrefixParams,
    ListOrgRepoNamesByPrefixResult,
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

    /**
     * Grants (or updates) a team's permission on a single org repo. Idempotent —
     * re-running with the same permission is a no-op on GitHub's side, so the
     * boot-time access sync can run on every deploy safely.
     *
     * @param param - Team slug, repo name, and permission level (default `pull`)
     * @returns Whether the grant call completed without error
     */
    async grantTeamRepoAccess(
        {
            teamSlug,
            repo,
            permission = "pull",
        }: GrantTeamRepoAccessParams,
    ): Promise<GrantTeamRepoAccessResult> {
        const octokit = new Octokit(
            {
                auth: this.mountStorageService.githubAccessToken,
            },
        )
        const org = envConfig().services.github.organization
        await octokit.rest.teams.addOrUpdateRepoPermissionsInOrg(
            {
                org,
                team_slug: teamSlug,
                owner: org,
                repo,
                permission,
            },
        )

        return {
            success: true,
        }
    }

    /**
     * Lists org repo names whose name starts with `prefix`. Used to resolve a
     * course's module repos (named `<courseDisplayId>-module-…`) from the
     * course→team mapping so the team can be granted access to all of them.
     *
     * @param param - The repo-name prefix to match
     * @returns The matching repo names
     */
    async listOrgRepoNamesByPrefix(
        {
            prefix,
        }: ListOrgRepoNamesByPrefixParams,
    ): Promise<ListOrgRepoNamesByPrefixResult> {
        const octokit = new Octokit(
            {
                auth: this.mountStorageService.githubAccessToken,
            },
        )
        const org = envConfig().services.github.organization
        const repos = await octokit.paginate(
            octokit.rest.repos.listForOrg,
            {
                org,
                per_page: 100,
                type: "all",
            },
        )

        return {
            repoNames: repos
                .map((repo) => repo.name)
                .filter((name) => name.startsWith(prefix)),
        }
    }
}