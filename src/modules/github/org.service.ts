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
}